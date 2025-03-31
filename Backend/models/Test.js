const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({
  studyPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
    required: true,
  },
  day: { type: Number, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  duration: {
    type: Number,
    min: 1,
    comment: "Test duration in minutes",
  },
  testType: {
    type: String,
    enum: ["daily", "weekly", "monthly","custom"],
    default: "daily",
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Test", TestSchema);
