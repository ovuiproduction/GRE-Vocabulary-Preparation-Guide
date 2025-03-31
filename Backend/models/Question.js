const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  word_id: { type: mongoose.Schema.Types.ObjectId, ref: "Word", required: true },
  question_type: { type: String, enum: ["MCQ", "FILL_IN_THE_BLANK"], required: true },
  question: { type: String, required: true },
  options: [{ type: String }], 
  answer: { type: String, required: true }, 
  explanation: { type: String }, 
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Question", QuestionSchema);
