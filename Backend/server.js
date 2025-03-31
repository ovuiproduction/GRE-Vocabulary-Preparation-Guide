const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

const userscoll = require("./models/userSchema");
const StudyPlan = require("./models/StudyPlan");
const Word = require("./models/Word");
const LearningProgress = require("./models/LearningProgress");
const Test = require("./models/Test");
const Question = require("./models/Question");
const TestTrack = require("./models/TestTrack");
const IncorrectQuestions = require("./models/IncorrectQuestions");

dotenv.config();
const secretKey = process.env.JWT_SECRET || "your_secret_key";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const nodemailer = require("nodemailer");

const port = 5000;

mongoose
  .connect("mongodb://localhost:27017/gredb")
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection error:", err));

app.get("/", (req, res) => {
  res.send("This is server");
});

// User Signup
app.post("/signup-user", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const existingUser = await userscoll.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or phone already exists",
      });
    }

    user = new userscoll({
      name,
      email,
      phone,
    });

    await user.save();

    res.status(201).json({ message: "User signup successful" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// User Login
app.post("/login-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userscoll.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        state: user.state,
        phone: user.phone,
        district: user.district,
        coins: user.coins,
      },
      secretKey,
      { expiresIn: "1h" }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate Random 6-Digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Request OTP
app.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userscoll.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Generate OTP & Store in DB
    let otp = generateOTP();
    user.otp = otp;
    await user.save();

    // Send OTP via Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userscoll.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful login
    user.otp = null;
    await user.save();

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      secretKey,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: err.message });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
  },
});

const upload = multer({ storage });

// Upload route
app.post("/upload-media", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Construct file URL
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ fileUrl });
});

// In your server route
app.post("/insert-word", async (req, res) => {
  try {
    const content = req.body.content || {};

    const newWord = new Word({
      ...req.body,
      content: {
        stories: Array.isArray(content.stories) ? content.stories : [],
        mnemonics: Array.isArray(content.mnemonics) ? content.mnemonics : [],
        cartoons: Array.isArray(content.cartoons) ? content.cartoons : [],
        clips: Array.isArray(content.clips) ? content.clips : [],
      },
    });

    await newWord.save();
    res.status(201).json(newWord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all words for selection
app.get("/get-words", async (req, res) => {
  try {
    const words = await Word.find().select("word definition tier difficulty");
    res.json(words);
  } catch (err) {
    res.status(500).json({ message: "Error fetching words" });
  }
});

// Create new study plan
app.post("/set-study-plan", async (req, res) => {
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

app.get("/get-study-plans", async (req, res) => {
  try {
    const studyPlans = await StudyPlan.find()
      .select("-__v -createdAt -updatedAt")
      .lean();

    res.status(200).json({
      success: true,
      count: studyPlans.length,
      data: studyPlans,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch study plans",
      error: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
});

app.patch("/update-study-plan", async (req, res) => {
  try {
    console.log("update study plan");
    const { userId, planId } = req.body;
    console.log(userId, planId);
    // Validate plan exists
    const planExists = await StudyPlan.exists({ _id: planId });
    if (!planExists) {
      return res.status(400).json({ message: "Invalid study plan" });
    }
    console.log(planExists);

    // Update user document
    const updatedUser = await userscoll.findByIdAndUpdate(
      userId,
      {
        study_plan: planId,
        daily_goal: (await StudyPlan.findById(planId)).daily_new_words,
      },
      { new: true }
    );
    console.log(updatedUser);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/study-plan/:id", async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id).populate("word_list");
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    // Distribute words into days based on daily_new_words
    const dailyWords = [];
    for (let i = 0; i < plan.word_list.length; i += plan.daily_new_words) {
      dailyWords.push(plan.word_list.slice(i, i + plan.daily_new_words));
    }

    res.json({
      name: plan.name,
      duration_days: plan.duration_days,
      daily_words: dailyWords,
      daily_new_words: plan.daily_new_words,
      total_words: plan.total_words,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/get-words/study-plan/:id/day/:dayIndex", async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id).populate("word_list");
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    const dayIndex = parseInt(req.params.dayIndex);
    if (dayIndex < 1 || dayIndex > plan.duration_days) {
      return res.status(400).json({ error: "Invalid day index" });
    }

    // Calculate words for the requested day
    const startIndex = (dayIndex - 1) * plan.daily_new_words;
    const words = plan.word_list.slice(
      startIndex,
      startIndex + plan.daily_new_words
    );

    res.json({ day: dayIndex, words });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put(
  "/update-learning-progress/:userId/:studyPlanId/:wordId",
  async (req, res) => {
    const { userId, studyPlanId, wordId } = req.params;
    try {
      await LearningProgress.findOneAndUpdate(
        { user_id: userId, word_id: wordId, studyPlanId: studyPlanId },
        { status: "learned", learned_on: new Date() },
        { upsert: true, new: true }
      );
      res.status(200).json({ message: "Word marked as learned" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  }
);

app.get("/get-learning-progress/:userId/:studyPlanId", async (req, res) => {
  try {
    const progress = await LearningProgress.find({
      user_id: req.params.userId,
      studyPlanId: req.params.studyPlanId,
    });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/get-words/study-plan/:studyPlanId", async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.studyPlanId).populate(
      "word_list"
    );
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found" });
    }
    const words = plan.word_list;
    res.json({ words });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/admin/add-question", async (req, res) => {
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

app.get("/get-questions/study-plan/:id/day/:dayIndex", async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id).populate("word_list");
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    const dayIndex = parseInt(req.params.dayIndex);
    if (dayIndex < 1 || dayIndex > plan.duration_days) {
      return res.status(400).json({ error: "Invalid day index" });
    }

    // Get words for the specific day
    const startIndex = (dayIndex - 1) * plan.daily_new_words;
    const wordsForDay = plan.word_list.slice(
      startIndex,
      startIndex + plan.daily_new_words
    );

    const wordIds = wordsForDay.map((word) => word._id);

    // Fetch questions related to these words
    const questions = await Question.find({ word_id: { $in: wordIds } });

    res.json({ day: dayIndex, questions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Route to create a new test
app.post("/admin/add-test", async (req, res) => {
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

app.get("/get-test/:studyPlanId/day/:selectedDay", async (req, res) => {
  try {
    const test = await Test.find({
      studyPlanId: req.params.studyPlanId,
      day: req.params.selectedDay,
    }).populate("questions");
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    res.json({ test });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch test" });
  }
});

app.post("/submit-test", async (req, res) => {
  try {
    const { userId, testId, selectedAnswers } = req.body;

    const test = await Test.findById(testId).populate("questions");
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let incorrectQuestionsList = [];

    for (const question of test.questions) {
      if (selectedAnswers[question._id] === question.answer) {
        correctAnswers++;
      } else {
        incorrectAnswers++;

        const isExistQue = await IncorrectQuestions.find({
          user_id: userId,
          word_id: question.word_id,
          question_id: question._id,
        });

        if (isExistQue.length == 0) {
          incorrectQuestionsList.push({
            user_id: userId,
            word_id: question.word_id, // Assuming `word` field exists in Question model
            question_id: question._id,
            test_id: testId,
          });
        }
      }
    }

    const score = correctAnswers; // Assuming each correct answer = 1 point

    // Insert or Update TestTrack
    let testTrack = await TestTrack.findOne({
      user_id: userId,
      test_id: testId,
    });

    if (testTrack) {
      testTrack.score = score;
      testTrack.correct_answers = correctAnswers;
      testTrack.incorrect_answers = incorrectAnswers;
      testTrack.total_questions = test.questions.length;
      testTrack.attempted_at = new Date();
      await testTrack.save();
    } else {
      testTrack = new TestTrack({
        user_id: userId,
        studyPlan: test.studyPlanId,
        test_id: testId,
        score,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        total_questions: test.questions.length,
      });
      await testTrack.save();
    }

    // Insert incorrect questions into IncorrectQuestion collection
    if (incorrectQuestionsList.length > 0) {
      await IncorrectQuestions.insertMany(incorrectQuestionsList);
    }

    res.json({
      message: "Test submitted successfully",
      score,
      correctAnswers,
      incorrectAnswers,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({ error: "Failed to submit test" });
  }
});
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
