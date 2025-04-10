const express = require('express');

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const StudyPlan = require("../models/StudyPlan");
const Word = require("../models/Word");
const Test = require("../models/Test");
const Question = require("../models/Question");
const Badge = require("../models/Badge");


const uploadPath = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.use("/uploads", express.static(uploadPath));

// Fetch all study plans
router.get('/study-plans', async (req, res) => {
  const plans = await StudyPlan.find().populate('word_list');
  res.json(plans);
});

// Fetch all words
router.get('/words', async (req, res) => {
  const words = await Word.find();
  res.json(words);
});

// Fetch all questions
router.get('/questions', async (req, res) => {
  const questions = await Question.find().populate('word_id');
  res.json(questions);
});

// Fetch all tests
router.get('/tests', async (req, res) => {
  const tests = await Test.find().populate('questions').populate('studyPlanId');
  res.json(tests);
});

// Fetch all badges
router.get('/badges', async (req, res) => {
  const badges = await Badge.find();
  res.json(badges);
});


router.post("/add-badge", upload.single("icon"), async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    const parsedCriteria = JSON.parse(criteria);

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const newBadge = new Badge({
      name,
      description,
      icon_url: fileUrl,
      criteria: parsedCriteria,
    });

    await newBadge.save();
    res.status(201).json({ success: true, badge: newBadge });
  } catch (error) {
    console.error("Error adding badge:", error);
    res.status(500).json({ success: false, message: "Failed to add badge" });
  }
});


router.post("/add-test", async (req, res) => {
  try {
    const { studyPlanId, day, questions, duration, testType } = req.body;

    if (!studyPlanId || !day || !questions.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newTest = new Test({
      studyPlanId,
      day,
      questions,
      duration: duration || 10, // Default duration is 10 minutes
      testType: testType || "daily",
    });

    await newTest.save();
    res
      .status(201)
      .json({ message: "Test created successfully", test: newTest });
  } catch (error) {
    res.status(500).json({ error: "Failed to create test" });
  }
});


router.post("/add-question-and-update-test", async (req, res) => {
  try {
    const {
      word_id,
      question_type,
      question,
      options,
      answer,
      explanation,
      difficulty,
    } = req.body;

    if (!word_id || !question || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Create Question
    const newQuestion = new Question({
      word_id,
      question_type,
      question,
      options: question_type === "MCQ" ? options : [],
      answer,
      explanation,
      difficulty: difficulty || "medium",
    });
    await newQuestion.save();

    // 2. Get the Word's dayIndex map
    const word = await Word.findById(word_id);
    if (word && word.dayIndex) {
      for (const [planId, day] of word.dayIndex.entries()) {
        const existingTest = await Test.findOne({ studyPlanId: planId, day });

        if (existingTest) {
          if (!existingTest.questions.includes(newQuestion._id)) {
            existingTest.questions.push(newQuestion._id);
            await existingTest.save();
          }
        } else {
          const newTest = new Test({
            studyPlanId: planId,
            day,
            questions: [newQuestion._id],
            duration: 10, // Default
            testType: "daily",
          });
          await newTest.save();
        }
      }
    }

    res
      .status(201)
      .json({ message: "Question added and test updated", question: newQuestion });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add question" });
  }
});


router.post("/add-question", async (req, res) => {
  try {
    const {
      word_id,
      question_type,
      question,
      options,
      answer,
      explanation,
      difficulty,
    } = req.body;

    if (!word_id || !question || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newQuestion = new Question({
      word_id,
      question_type,
      question,
      options: question_type === "MCQ" ? options : [],
      answer,
      explanation,
      difficulty: difficulty || "medium", // Default difficulty is medium
    });

    await newQuestion.save();
    res
      .status(201)
      .json({ message: "Question added successfully", question: newQuestion });
  } catch (error) {
    res.status(500).json({ error: "Failed to add question" });
  }
});


// In your server route
// router.post("/add-word", async (req, res) => {
//   try {
//     const content = req.body.content || {};

//     const newWord = new Word({
//       ...req.body,
//       content: {
//         stories: Array.isArray(content.stories) ? content.stories : [],
//         mnemonics: Array.isArray(content.mnemonics) ? content.mnemonics : [],
//         cartoons: Array.isArray(content.cartoons) ? content.cartoons : [],
//         clips: Array.isArray(content.clips) ? content.clips : [],
//       },
//     });

//     await newWord.save();
//     res.status(201).json(newWord);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

router.post("/add-word", async (req, res) => {
  try {
    const content = req.body.content || {};
    const studyPlans = req.body.study_plan || [];
    const newWord = new Word({
      ...req.body,
      study_plan: studyPlans,
      dayIndex: req.body.dayIndex || {} ,
      content: {
        stories: Array.isArray(content.stories) ? content.stories : [],
        mnemonics: Array.isArray(content.mnemonics) ? content.mnemonics : [],
        cartoons: Array.isArray(content.cartoons) ? content.cartoons : [],
        clips: Array.isArray(content.clips) ? content.clips : [],
      },
    });

    await newWord.save();

    // Update each selected StudyPlan with the new word
    await Promise.all(
      studyPlans.map(async (planId) => {
        await StudyPlan.findByIdAndUpdate(planId, {
          $addToSet: { word_list: newWord._id }, // avoid duplicates
        });
      })
    );

    res.status(201).json(newWord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Create new study plan
router.post("/add-study-plan", async (req, res) => {
  try {
    // Validate word_list
    const validWords = await Word.find({
      _id: { $in: req.body.word_list },
    });

    if (validWords.length !== req.body.word_list.length) {
      return res.status(400).json({ message: "Invalid words in word list" });
    }

    const newPlan = new StudyPlan(req.body);
    await newPlan.save();

    res.status(201).json(newPlan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
