const mongoose = require("mongoose");

const IncorrectQuestionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  word_id: { type: mongoose.Schema.Types.ObjectId, ref: "Word", required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  test_id: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  marked_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("IncorrectQuestions", IncorrectQuestionSchema);
