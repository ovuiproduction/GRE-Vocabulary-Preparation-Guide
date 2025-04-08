const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    stories: [
      {
        text: String,
        upvotes: {
          type: Number,
          default: 0,
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    mnemonics: [
      {
        text: String,
        media_url: String,
      },
    ],
  },
  { _id: false }
);

const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    study_plan: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPlan",
      default: null,
    }],
    dayIndex: {
      type: Map,
      of: {
        type: Number,
        min: 1,
      },
      default: {},
    },    
    definition: {
      type: String,
      required: true,
    },
    synonyms: [String],
    antonyms: [String],
    tier: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    difficulty: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    content: contentSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Word", wordSchema);
