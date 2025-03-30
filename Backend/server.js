const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

const userscoll = require("./models/userSchema");
const StudyPlan =  require("./models/StudyPlan");
const Word = require("./models/Word");
const Content = require("./models/Content");

dotenv.config();
const secretKey = process.env.JWT_SECRET || "your_secret_key";

const app = express();
app.use(express.json({ limit: "50mb" })); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const nodemailer = require("nodemailer");

const port = 5000;

mongoose.connect("mongodb://localhost:27017/gredb")
    .then(() => console.log("Connected to database"))
    .catch((err) => console.error("Database connection error:", err));

app.get("/", (req, res) => {
    res.send("This is server");
});

// User Signup
app.post("/signup-user", async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const existingUser = await userscoll.findOne({ 
            $or: [{ email }, { phone }]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: "User with this email or phone already exists" 
            });
        }
   
        user = new userscoll({
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


// User Login
app.post("/login-user", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userscoll.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { userId: user._id, name: user.name, email: user.email, state: user.state, phone: user.phone, district: user.district, coins: user.coins },
            secretKey,
            { expiresIn: "1h" }
        );

        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


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
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Request OTP
app.post("/request-otp", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await userscoll.findOne({ email });
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

app.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await userscoll.findOne({ email });
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
        res.status(500).json({ message: "Error verifying OTP", error: err.message });
    }
});


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  

const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
    },
  });
  
  const upload = multer({ storage });
  
  // Upload route
  app.post("/upload-media", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
  
    // Construct file URL
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  });

// In your server route
app.post('/insert-word', async (req, res) => {
    try {
      const content = req.body.content || {};
      
      const newWord = new Word({
        ...req.body,
        content: {
          stories: Array.isArray(content.stories) ? content.stories : [],
          mnemonics: Array.isArray(content.mnemonics) ? content.mnemonics : [],
          cartoons: Array.isArray(content.cartoons) ? content.cartoons : [],
          clips: Array.isArray(content.clips) ? content.clips : []
        }
      });
  
      await newWord.save();
      res.status(201).json(newWord);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
});



// Get all words for selection
app.get('/get-words', async (req, res) => {
    try {
      const words = await Word.find().select('word definition tier difficulty');
      res.json(words);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching words' });
    }
});
  
  // Create new study plan
  app.post('/set-study-plan', async (req, res) => {
    try {
      // Validate word_list
      const validWords = await Word.find({
        _id: { $in: req.body.word_list }
      });
  
      if (validWords.length !== req.body.word_list.length) {
        return res.status(400).json({ message: 'Invalid words in word list' });
      }
  
      const newPlan = new StudyPlan(req.body);
      await newPlan.save();
      
      res.status(201).json(newPlan);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
});


app.get('/get-study-plans', async (req, res) => {
  try {
    const studyPlans = await StudyPlan.find()
      .select('-__v -createdAt -updatedAt')
      .lean();

    res.status(200).json({
      success: true,
      count: studyPlans.length,
      data: studyPlans
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study plans',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});




app.patch('/users/update-study-plan', async (req, res) => {
    try {
      const { userId, planId } = req.body;
  
      // Validate plan exists
      const planExists = await StudyPlan.exists({ _id: planId });
      if (!planExists) {
        return res.status(400).json({ message: 'Invalid study plan' });
      }
  
      // Update user document
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          study_plan: planId,
          daily_goal: (await StudyPlan.findById(planId)).daily_new_words
        },
        { new: true }
      );
  
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
});







app.listen(port, () => {
    console.log(`Server running on ${port}`);
})