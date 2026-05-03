const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const { auth } = require("../middleware/authMiddleware");

// 📩 ส่งข้อความ
router.post("/send", auth, async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.user.id,
      sender: "user",
      message: req.body.message,
      isRead: false
    });

    await chat.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📥 ดึงข้อความ
router.get("/messages", auth, async (req, res) => {
  try {
    const messages = await Chat.find({ userId: req.user.id })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET CHAT BY USER =================
router.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Chat.find({ userId })
      .sort({ createdAt: 1 }); // เรียงเก่า → ใหม่

    res.json(messages);

  } catch (err) {
    console.error("❌ chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;