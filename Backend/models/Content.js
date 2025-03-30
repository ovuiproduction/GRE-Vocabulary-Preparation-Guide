const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  word_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    required: true,
    unique: true
  },
  stories: [{
    text: {
      type: String,
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0
    },
  }],
  mnemonics: [{
    text: String,
    media_url: String
  }],
  cartoons: [{
    media_url: {
      type: String,
    },
  }],
  clips: [{
    media_url: {
      type: String,
    },
  }]
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);