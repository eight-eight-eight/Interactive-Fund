const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const { auth, adminOnly } = require("../middleware/authMiddleware");
router.use(auth, adminOnly);
// ================= GET UNREAD =================
router.get("/unread", async (req, res) => {
  try {
    const unread = await Chat.aggregate([
      { $match: { sender: "user", isRead: false } },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(unread);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= MARK AS READ =================
router.post("/mark-read", async (req, res) => {
  try {
    const { userId } = req.body;

    await Chat.updateMany(
      { userId, sender: "user", isRead: false },
      { isRead: true }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= ADMIN REPLY =================
router.post("/reply", async (req, res) => {
  try {
    const { userId, message } = req.body;

    const chat = new Chat({
      userId,
      sender: "admin",
      message,
      isRead: true // admin ส่ง = ถือว่าอ่านแล้ว
    });

    await chat.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= GET CHAT BY USER =================
router.get("/messages/:userId", async (req, res) => {
  try {
    const messages = await Chat.find({
      userId: req.params.userId
    }).sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;