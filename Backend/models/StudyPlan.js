const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    unique: true
  },
  duration_days: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 day']
  },
  daily_new_words: {
    type: Number,
    required: true,
    min: [5, 'Minimum 5 words per day']
  },
  total_words: {
    type: Number,
    required: true,
    min: [100, 'Minimum 100 words per plan']
  },
  revision_strategy: {
    mode: {
      type: String,
      enum: ['adaptive', 'fixed_schedule'],
      default: 'adaptive'
    },
    rules: {
      min_incorrect_attempts: {
        type: Number,
        default: 2,
        min: 1
      },
      max_revisions_per_day: {
        type: Number,
        default: 10,
        min: 5
      },
      retention_threshold: {
        type: Number,
        default: 0.7,
        min: 0.1,
        max: 1.0
      }
    }
  },
  word_list: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    required: true
  }]
}, { timestamps: true });

module.exports =  mongoose.model('StudyPlan', studyPlanSchema);
