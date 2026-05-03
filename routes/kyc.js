const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || "SECRET";

// 📁 upload config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// 🔐 auth middleware
function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// 🚀 SUBMIT KYC
router.post(
  "/submit",
  auth,
  upload.fields([
    { name: "frontImage" },
    { name: "backImage" }
  ]),
  async (req, res) => {
    try {
      // 🔥 กันพัง (สำคัญมาก)
      if (!req.files?.frontImage || !req.files?.backImage) {
        return res.status(400).json({ message: "Missing images" });
      }

      await User.findByIdAndUpdate(req.user.userId, {
        "kyc.status": "pending",
        "kyc.nationality": req.body.nationality,
        "kyc.fullName": req.body.fullName,
        "kyc.address": req.body.address,
        "kyc.idNumber": req.body.idNumber,
        "kyc.frontImage": req.files.frontImage[0].filename,
        "kyc.backImage": req.files.backImage[0].filename
      });

      res.json({ message: "KYC submitted" });

    } catch (err) {
      console.error("KYC ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// 📥 GET KYC (admin ใช้)
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.kyc || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ APPROVE
router.post("/approve/:userId", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      "kyc.status": "approved"
    });

    res.json({ message: "Approved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ❌ REJECT
router.post("/reject/:userId", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      "kyc.status": "rejected"
    });

    res.json({ message: "Rejected" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;