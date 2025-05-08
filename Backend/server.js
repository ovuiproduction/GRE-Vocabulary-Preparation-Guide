const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const axios = require("axios");

const users = require("./models/users");
const StudyPlan = require("./models/StudyPlan");
const Word = require("./models/Word");
const LearningProgress = require("./models/LearningProgress");
const Test = require("./models/Test");
const Question = require("./models/Question");
const TestTrack = require("./models/TestTrack");
const IncorrectQuestions = require("./models/IncorrectQuestions");
const Badge = require("./models/Badge");
const StreakTracker = require("./models/StreakTracker");
const DayWiseProgress = require("./models/DayWiseProgress");

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

const database_url = process.env.DB_URL;

// mongoose.connect(database_url, {
//   ssl: true
// })
// .then(() => console.log('MongoDB connected'))
// .catch(err => console.error('MongoDB connection error:', err));

mongoose.connect(database_url).then(()=>{
  console.log('MongoDB connected');
});

app.get("/", (req, res) => {
  res.send("This is server");
});

app.use("/admin", adminRoutes);
app.use("/auth/user", authRoutes);

app.get("/user/:id", async (req, res) => {
  const user = await users.findById(req.params.id);
  res.json(user);
});

// Upload route
app.post("/upload-media", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

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
    const { userId, planId } = req.body;

    // Validate plan exists
    const planExists = await StudyPlan.exists({ _id: planId });
    if (!planExists) {
      return res.status(400).json({ message: "Invalid study plan" });
    }

    // Update user document
    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        study_plan: planId,
        daily_goal: (await StudyPlan.findById(planId)).daily_new_words,
      },
      { new: true }
    );
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

app.get("/get-words/:studyPlanId/day/:dayIndex", async (req, res) => {
  const { studyPlanId, dayIndex } = req.params;

  try {
    // Fetch words where dayIndex has an entry for the given studyPlanId with the given day number
    const words = await Word.find({
      [`dayIndex.${studyPlanId}`]: parseInt(dayIndex),
    });

    res.json({ words });
  } catch (error) {
    console.error("Error fetching words:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put(
  "/update-learning-progress/:userId/:studyPlanId/day/:dayIndex/:wordId",
  async (req, res) => {
    const { userId, studyPlanId, dayIndex, wordId } = req.params;

    try {
      // Step 1: Update word-level progress
      await LearningProgress.findOneAndUpdate(
        { user_id: userId, word_id: wordId, studyPlanId },
        { status: "learned", learned_on: new Date() },
        { upsert: true, new: true }
      );

      // Step 2: Update or create DayWiseProgress
      let dayProgress = await DayWiseProgress.findOne({
        user_id: userId,
        studyPlanId,
        dayIndex,
      });

      if (!dayProgress) {
        dayProgress = new DayWiseProgress({
          user_id: userId,
          studyPlanId,
          dayIndex,
          completedWords: [wordId],
        });
      } else {
        if (!dayProgress.completedWords.includes(wordId)) {
          dayProgress.completedWords.push(wordId);
        }
      }

      // Step 3: Check if all words for the day are learned
      const studyPlan = await StudyPlan.findById(studyPlanId).populate(
        "word_list"
      );

      if (!studyPlan || !studyPlan.word_list) {
        return res.status(400).json({ error: "Study plan or words not found" });
      }

      const dailyWords = studyPlan.word_list.filter((word) => {
        return word.dayIndex === parseInt(dayIndex);
      });

      const learnedWordIds = dayProgress.completedWords.map((id) => String(id));
      const dailyWordIds = dailyWords.map((word) => String(word._id));

      const allCompleted = dailyWordIds.every((id) =>
        learnedWordIds.includes(id)
      );

      if (allCompleted) {
        dayProgress.completedOnDay = true;
        dayProgress.completedAt = new Date();
      }

      await dayProgress.save();

      // Step 4: Update streak
      await axios.put(
        `http://localhost:5000/update-streak/${userId}/${studyPlanId}`
      );

      res.status(200).json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating progress:", error);
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

  let studyPlanId = user.study_plan;

  const pastTests = await TestTrack.find({ userId }).sort({ date: 1 });
  const userScores = pastTests.map((t) => t.score);
  const newBadges = [];

  for (const badge of badges) {
    const { type, threshold } = badge.criteria;
    const alreadyAwarded = user.badges.some(
      (b) =>
        b.badgeId.equals(badge._id) &&
        b.studyPlanId &&
        b.studyPlanId.equals(studyPlanId)
    );

    if (alreadyAwarded) continue;

    if (type === "test_score" && latestScore >= threshold) {
      newBadges.push({
        badgeId: badge._id,
        awardedOn: new Date(),
        studyPlanId: studyPlanId,
      });
    }

    if (type === "streak") {
      const streak = countHighScoreStreak([...userScores, latestScore], 80);
      if (streak >= threshold) {
        newBadges.push({
          badgeId: badge._id,
          awardedOn: new Date(),
          studyPlanId: studyPlanId,
        });
      }
    }
  }

  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
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

app.post("/start-learning", async (req, res) => {
  try {
    const { userId, studyPlanId } = req.body;

    if (!userId || !studyPlanId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const today = new Date();

    // 1. Update User startDate
    await users.findByIdAndUpdate(userId, {
      startDate: today,
      started_learning: true,
    });

    // 2. Create or update StreakTracker
    const existingTracker = await StreakTracker.findOne({
      user_id: userId,
      studyPlanId,
    });

    if (existingTracker) {
      // If exists, reset streak and update startDate
      existingTracker.startDate = today;
      existingTracker.currentStreak = 0;
      existingTracker.completedDays = [];
      existingTracker.lastCheckedDate = null;
      await existingTracker.save();
    } else {
      // Create new tracker
      const newTracker = new StreakTracker({
        user_id: userId,
        studyPlanId,
        startDate: today,
        currentStreak: 0,
        completedDays: [],
        lastCheckedDate: null,
      });
      await newTracker.save();
    }

    res.status(200).json({ message: "Learning session started!" });
  } catch (error) {
    console.error("Error starting learning:", error);
    res.status(500).json({ error: "Failed to start learning" });
  }
});

app.get("/word-stats/:userId/:studyPlanId/:day", async (req, res) => {
  const { userId, studyPlanId, day } = req.params;

  const progress = await DayWiseProgress.findOne({
    user_id: userId,
    studyPlanId,
    dayIndex: day,
  });

  const assignedWordsDocs = await Word.find({
    [`dayIndex.${studyPlanId}`]: day,
  }).select("word");

  let learnedCount = 0;
  if (progress) {
    learnedCount = progress?.completedWords.length;
  }
  const totalAssigned = assignedWordsDocs.length;

  res.json({
    learned: learnedCount,
    totalWords: totalAssigned,
    remaining: totalAssigned - learnedCount,
  });
});





// app.put("/update-streak/:userId/:studyPlanId", async (req, res) => {
//   const { userId, studyPlanId } = req.params;

//   try {
//     const user = await users.findById(userId);
//     if (!user || !user.startDate) {
//       return res.status(400).json({ error: "User or startDate not found" });
//     }

//     const plan = await StudyPlan.findById(studyPlanId);
//     if (!plan) {
//       return res.status(404).json({ error: "Study plan not found" });
//     }

//     const startDate = new Date(user.startDate);
//     const today = new Date();

//     startDate.setHours(0, 0, 0, 0);
//     today.setHours(0, 0, 0, 0);

//     const timeDiff = today.getTime() - startDate.getTime();
//     const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

//     totalDays = Math.max(
//       1,
//       Math.min(daysSinceStart, plan.duration_days)
//     );

//     let currentStreak = 0;
//     const completedDays = [];

//     for (let day = 1; day <= totalDays; day++) {
//       const progress = await DayWiseProgress.findOne({
//         user_id: userId,
//         studyPlanId,
//         dayIndex: day,
//       });

//       if (!progress) break;

//       const assignedWordsDocs = await Word.find({
//         [`dayIndex.${studyPlanId}`]: day,
//       }).select("_id");

//       const assignedWordIds = assignedWordsDocs.map((w) => w._id.toString());
//       const completed = (progress.completedWords || []).map((id) =>
//         id.toString()
//       );

//       const allCompleted = assignedWordIds.every((wordId) =>
//         completed.includes(wordId)
//       );

//       if (!allCompleted) break;

//       currentStreak++;
//       completedDays.push(day);
//     }

//     // Update user streak
//     user.streak = currentStreak;
//     await user.save();

//     // Update or create StreakTracker
//     const updatedTracker = await StreakTracker.findOneAndUpdate(
//       { user_id: userId, studyPlanId },
//       {
//         $set: {
//           currentStreak,
//           lastCheckedDate: today,
//         },
//         $addToSet: {
//           completedDays: { $each: completedDays },
//         },
//       },
//       { upsert: true, new: true }
//     );

//     res.json({
//       message: "Streak updated",
//       streak: currentStreak,
//       streakTracker: updatedTracker,
//     });
//   } catch (error) {
//     console.error("Error updating streak:", error);
//     res.status(500).json({ error: "Failed to update streak" });
//   }
// });

app.put("/update-streak/:userId/:studyPlanId", async (req, res) => {
  const { userId, studyPlanId } = req.params;

  try {
    const user = await users.findById(userId);
    if (!user || !user.startDate) {
      return res.status(400).json({ error: "User or startDate not found" });
    }

    const plan = await StudyPlan.findById(studyPlanId);
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    const startDate = new Date(user.startDate);
    const today = new Date();

    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - startDate.getTime();
    const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    const totalDays = Math.max(1, Math.min(daysSinceStart, plan.duration_days));

    let currentStreak = 0;
    const completedDays = [];

    for (let day = 1; day <= totalDays; day++) {
      const progress = await DayWiseProgress.findOne({
        user_id: userId,
        studyPlanId,
        dayIndex: day,
      });

      if (!progress) {
        currentStreak = 0;
        break;
      }

      const assignedWordsDocs = await Word.find({
        [`dayIndex.${studyPlanId}`]: day,
      }).select("_id");

      const assignedWordIds = assignedWordsDocs.map((w) => w._id.toString());
      const completed = (progress.completedWords || []).map((id) =>
        id.toString()
      );

      const allCompleted = assignedWordIds.every((wordId) =>
        completed.includes(wordId)
      );

      if (!allCompleted) {
        currentStreak = 0;
        break;
      }

      currentStreak++;
      completedDays.push(day);
    }

    // Update user streak
    user.streak = currentStreak;
    await user.save();

    // Update or create StreakTracker
    const updatedTracker = await StreakTracker.findOneAndUpdate(
      { user_id: userId, studyPlanId },
      currentStreak === 0
        ? {
            $set: {
              currentStreak: 0,
              lastCheckedDate: today,
              completedDays: [],
            },
          }
        : {
            $set: {
              currentStreak,
              lastCheckedDate: today,
            },
            $addToSet: {
              completedDays: { $each: completedDays },
            },
          },
      { upsert: true, new: true }
    );

    res.json({
      message: "Streak updated",
      streak: currentStreak,
      streakTracker: updatedTracker,
    });
  } catch (error) {
    console.error("Error updating streak:", error);
    res.status(500).json({ error: "Failed to update streak" });
  }
});


app.get("/test-track-status", async (req, res) => {
  const { userId, studyPlanId, testId } = req.query;
  try {
    const track = await TestTrack.findOne({
      user_id: userId,
      studyPlan: studyPlanId,
      test_id: testId,
    });

    if (track) {
      res.json({
        attempted: true,
        score: track.total_questions==0 ? 0 : (track.score /  track.total_questions)*100,
        correct_answers: track.correct_answers,
        total_questions: track.total_questions,
        attempted_at: track.attempted_at,
      });
    } else {
      res.json({ attempted: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch test track info" });
  }
});

app.get("/all-word-stats/:userId/:studyPlanId", async (req, res) => {
  const { userId, studyPlanId } = req.params;

  try {
    // Get all progress for the user and study plan
    const progressDocs = await DayWiseProgress.find({
      user_id: userId,
      studyPlanId,
    });

    // Create a map for quick lookup of learned words per day
    const progressMap = {};
    for (const doc of progressDocs) {
      progressMap[doc.dayIndex] = doc.completedWords?.length || 0;
    }

    // Get all assigned words for this study plan, grouped by day
    const wordDocs = await Word.find({
      [`dayIndex.${studyPlanId}`]: { $exists: true },
    }).select("dayIndex");

  
    // Aggregate word counts by day
    const wordMap = {};
    for (const doc of wordDocs) {
      const day = doc.dayIndex.get(studyPlanId);
      wordMap[day] = (wordMap[day] || 0) + 1;
    }

   
    // Build response for all days (up to max available day)
    const allDays = new Set([
      ...Object.keys(progressMap),
      ...Object.keys(wordMap),
    ]);

    const stats = Array.from(allDays).map((dayStr) => {
      const day = parseInt(dayStr);
      const learned = progressMap[day] || 0;
      const total = wordMap[day] || 0;
      return {
        day,
        learned,
        totalWords: total,
        remaining: total - learned,
      };
    });

    res.json(stats.sort((a, b) => a.day - b.day));
  } catch (err) {
    console.error("Failed to fetch all word stats:", err);
    res.status(500).json({ error: "Failed to fetch all word stats" });
  }
});

app.get("/all-test-progress/:userId/:studyPlanId", async (req, res) => {
  const { userId, studyPlanId } = req.params;
  try {
    // Fetch all tests for this study plan
    const testDocs = await Test.find({ studyPlanId: studyPlanId });
    // Extract test IDs
    const testIds = testDocs.map((t) => t._id.toString());

    // Fetch all test track records for this user and study plan
    const trackDocs = await TestTrack.find({
      user_id: userId,
      studyPlan: studyPlanId,
      test_id: { $in: testIds },
    });

    // Create a map of testId -> tracking info
    const trackMap = {};
    for (const track of trackDocs) {
      trackMap[track.test_id.toString()] = {
        attempted: true,
        score: track.total_questions==0 ? 0 : (track.score /  track.total_questions)*100,
        correct_answers: track.correct_answers,
        total_questions: track.total_questions,
        attempted_at: track.attempted_at,
      };
    }

    // Build combined response
    const result = testDocs.map((test) => {
      const testId = test._id.toString();
      const tracking = trackMap[testId] || { attempted: false, score: 0 };

      return {
        day: test.day,
        testId,
        testExists: true,
        ...tracking,
      };
    });

    res.json(result.sort((a, b) => a.day - b.day));
  } catch (err) {
    console.error("Failed to fetch all test progress:", err);
    res.status(500).json({ error: "Failed to fetch all test progress" });
  }
});

app.get("/get/badges",async(req,res)=>{
  const badges = await Badge.find({
    "criteria.type": { $in: ["test_score", "streak"] },
  });
  res.json(badges);
})

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
