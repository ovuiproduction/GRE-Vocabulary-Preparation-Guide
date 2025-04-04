const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const users = require("./models/users");
const StudyPlan = require("./models/StudyPlan");
const Word = require("./models/Word");
const LearningProgress = require("./models/LearningProgress");
const Test = require("./models/Test");
const Question = require("./models/Question");
const TestTrack = require("./models/TestTrack");
const IncorrectQuestions = require("./models/IncorrectQuestions");
const Badge = require("./models/Badge");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");

const port = 5000;

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
  },
});

const upload = multer({ storage });

mongoose
  .connect("mongodb://localhost:27017/gredb")
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection error:", err));


app.get("/", (req, res) => {
  res.send("This is server");
});

app.use("/admin", adminRoutes);
app.use("/auth/user", authRoutes);

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


// Get all words for selection
app.get("/get-words", async (req, res) => {
  try {
    const words = await Word.find().select("word definition tier difficulty");
    res.json(words);
  } catch (err) {
    res.status(500).json({ message: "Error fetching words" });
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
    const updatedUser = await users.findByIdAndUpdate(
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

    await checkAndAssignBadges(userId, score);

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

const checkAndAssignBadges = async (userId, latestScore) => {
  const badges = await Badge.find({
    "criteria.type": { $in: ["test_score", "streak"] },
  });

  const user = await users.findById(userId);
  const pastTests = await TestTrack.find({ userId }).sort({ date: 1 }); // sorted by time

  const userScores = pastTests.map((t) => t.score); // assuming `score` is out of 100

  const qualifiedBadges = [];

  for (const badge of badges) {
    const { type, threshold } = badge.criteria;

    // Avoid duplicate assignment
    if (user.badges.includes(badge._id)) continue;

    if (type === "test_score" && latestScore >= threshold) {
      qualifiedBadges.push(badge._id);
    }

    if (type === "streak") {
      const streak = countHighScoreStreak([...userScores, latestScore], 80);
      if (streak >= threshold) {
        qualifiedBadges.push(badge._id);
      }
    }
  }

  if (qualifiedBadges.length > 0) {
    user.badges.push(...qualifiedBadges);
    await user.save();
  }
};

function countHighScoreStreak(scores, minScore) {
  let count = 0;
  for (let i = scores.length - 1; i >= 0; i--) {
    if (scores[i] >= minScore) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
