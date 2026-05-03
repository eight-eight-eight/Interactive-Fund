const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "SECRET";

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ❌ ไม่มี header
    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    // ❌ token ไม่ถูกต้อง
    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const decoded = jwt.verify(token, SECRET);

    req.userId = decoded.userId;

    next();

  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Token error" });
  }
}

// ================= GET NOTIFICATIONS =================
router.get("/", auth, async (req, res) => {
  try {
    const data = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= MARK ALL AS READ =================
router.post("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId },
      { isRead: true }
    );

    res.json({ message: "read" });

  } catch (err) {
    console.error("READ NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= SEND NOTIFICATION =================
router.post("/send", async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    // ❌ validation
    if (!userId || !title || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔥 fallback type
    const finalType = type || "SYSTEM";

    await Notification.create({
      userId,
      title,
      message,
      type: finalType, // ✅ เพิ่มตรงนี้
      isRead: false,
      createdAt: new Date()
    });

    res.json({ message: "sent" });

  } catch (err) {
    console.error("SEND NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;