const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [
      /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/,
      "Invalid phone number format",
    ],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Invalid email format",
    ],
  },
  otp:{type:String},
  study_plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyPlan',
    default:null
  },
  daily_goal: {
    type: Number,
    min: 10,
    max: 40,
    default: null,
  },
  streak: {
    type: Number,
    default: 0,
    min: 0,
  },
  total_points: {
    type: Number,
    default: 0,
    min: 0,
  },
  badges: [
    {
      type: Schema.Types.ObjectId,
      ref: "Badge",
    },
  ],
  activity_log: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        required: true,
      },
      default: [],
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ phone: 1 });
userSchema.index({ study_plan: 1, total_points: -1 });

module.exports = mongoose.model("userscoll", userSchema);
