const mongoose = require("mongoose");

const TestTrackSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true },
  test_id: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  score: { type: Number, default: 0 },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, default: 0 },
  incorrect_answers: { type: Number, default: 0 },
  attempted_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TestTrack", TestTrackSchema);
