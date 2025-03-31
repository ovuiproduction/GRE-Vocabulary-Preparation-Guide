const mongoose = require("mongoose");

const LearningProgressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Optimizes queries filtering by user
  },
  word_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
    index: true, // Optimizes queries filtering by word
  },
  studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true },
  status: {
    type: String,
    enum: ["learning", "learned"], // "learning" = still in progress, "learned" = completed
    default: "learning",
  },
  learned_on: {
    type: Date, // Stores the date when the user learned the word
    default: null,
  },
  last_practiced: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

LearningProgressSchema.index({ user_id: 1, word_id: 1 }, { unique: true });

module.exports = mongoose.model("LearningProgress", LearningProgressSchema);
