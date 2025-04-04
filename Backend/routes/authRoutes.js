const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");

const router = express.Router();
router.use(cors());

dotenv.config();
const secretKey = process.env.JWT_SECRET || "your_secret_key";


const users = require("../models/users");


// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate Random 6-Digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const existingUser = await users.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or phone already exists",
      });
    }

    const user = new users({
      name,
      email,
      phone,
    });

    await user.save();

    res.status(201).json({ message: "User signup successful" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Request OTP
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await users.findOne({ email });
  
    if (!user) return res.status(400).json({ message: "User not found" });

    // Generate OTP & Store in DB
    let otp = generateOTP();
    user.otp = otp;
    await user.save();

    // Send OTP via Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await users.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful login
    user.otp = null;
    await user.save();

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      secretKey,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: err.message });
  }
});

module.exports = router;
