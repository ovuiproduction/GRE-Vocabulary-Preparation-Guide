const mongoose =  require("mongoose");

const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon_url: String, // local path like /uploads/badge123.png
  criteria: {
    type: {
      type: String,
      enum: ["streak", "points", "test_score", "test_high_scores", "test_improvement", "test_streak_score"]
    },
    threshold: Number
  }
});

module.exports = mongoose.model("Badge", badgeSchema);

