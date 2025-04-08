const mongoose = require("mongoose");

const DayWiseProgressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  studyPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
    required: true,
  },
  dayIndex: {
    type: Number,
    required: true,
  },
  completedWords: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
    },
  ],
  completedOnDay: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

DayWiseProgressSchema.index({ user_id: 1, studyPlanId: 1, dayIndex: 1 }, { unique: true });

module.exports = mongoose.model("DayWiseProgress", DayWiseProgressSchema);
