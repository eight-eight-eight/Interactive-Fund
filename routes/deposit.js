const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User");

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "SECRET";

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ================= AUTH =================
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    // 🔥 รองรับ Bearer
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, SECRET);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ================= CREATE DEPOSIT =================
router.post("/create", auth, upload.single("slip"), async (req, res) => {
  try {
    const { amount, method } = req.body;

    const slip = req.file ? req.file.filename : "";

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const deposit = new Deposit({
      userId: user._id,
      email: user.email,
      amount,
      method,
      slip,
      status: "pending"
    });

    await deposit.save();

    // ✅ realtime (แก้ตรงนี้)
    if (global.sendAdminUpdate) {
      global.sendAdminUpdate("NEW_DEPOSIT", deposit);
    }

    res.json({ message: "Deposit request sent" });

  } catch (err) {
    console.error("DEPOSIT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;