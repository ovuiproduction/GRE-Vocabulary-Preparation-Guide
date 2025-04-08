const mongoose = require("mongoose");

const StreakTrackerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studyPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  completedDays: [Number],
  lastCheckedDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("StreakTracker", StreakTrackerSchema);
