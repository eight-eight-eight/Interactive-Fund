const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const Deposit = require("../models/Deposit");
const { auth, adminOnly } = require("../middleware/authMiddleware");
router.use(auth, adminOnly);
// ================= TEST =================
router.get("/test", (req, res) => {
  res.send("admin route works");
});

// ================= GET ALL USERS =================
router.get("/", async (req, res) => {
  try {

    const users = await User.find().select("-password");

    res.json(users);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET USER =================
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= USER DEPOSITS =================
router.get("/:id/deposits", auth, async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.params.id })
      .sort({ createdAt: -1 });

    res.json(deposits);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ADD BALANCE =================
router.post("/users/:id/add", auth, async (req, res) => {
  const { amount } = req.body;

  await User.findByIdAndUpdate(req.params.id, {
    $inc: { balance: Number(amount) }
  });

  res.json({ message: "Balance added" });
});

// ================= SUBTRACT =================
router.post("/users/:id/subtract", auth, async (req, res) => {
  const { amount } = req.body;

  await User.findByIdAndUpdate(req.params.id, {
    $inc: { balance: -Number(amount) }
  });

  res.json({ message: "Balance subtracted" });
});

// ================= REPLY =================
router.post("/reply", auth, async (req, res) => {
  try {
    const { userId, message } = req.body;

    const chat = new Chat({
      userId,
      sender: "admin",
      message
    });

    await chat.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= UPDATE WALLET =================
router.post("/update-wallet/:id", auth, async (req, res) => {
  try {
    console.log("🔥 UPDATE WALLET HIT");

    const { balance, totalDeposit, withdrawnToday } = req.body;

    await User.findByIdAndUpdate(req.params.id, {
      balance: Number(balance) || 0,
      totalDeposit: Number(totalDeposit) || 0,
      withdrawnToday: Number(withdrawnToday) || 0
    });

    res.json({ message: "updated" });

  } catch (err) {
    console.error("UPDATE WALLET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;