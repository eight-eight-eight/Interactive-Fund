const express = require("express");
const router = express.Router();
const Withdraw = require("../models/WithdrawRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { auth, adminOnly } = require("../middleware/authMiddleware");
router.use(auth, adminOnly);

// ================= GET USER WITHDRAW =================
router.get("/users/:id/withdraws", async (req, res) => {
  try {
    const userId = req.params.id; // ✅ ใช้ string ให้ตรงกับ model ตอนนี้

    const withdraws = await Withdraw.find({
      userId: userId
    }).sort({ createdAt: -1 });

    console.log("WITHDRAW FOUND:", withdraws.length);

    res.json(withdraws);

  } catch (err) {
    console.error("GET WITHDRAW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= APPROVE =================
router.post("/:id/approve", async (req, res) => {
  try {
    console.log("🔥 APPROVE WITHDRAW:", req.params.id);

    const w = await Withdraw.findById(req.params.id);

    if (!w) {
      return res.status(404).json({ message: "Withdraw not found" });
    }

    if (w.status !== "pending") {
      return res.status(400).json({ message: "Invalid withdraw" });
    }

    // 🔥 อัปเดตสถิติ (ไม่หักเงิน เพราะหักไปแล้วตอน create)
    await User.findByIdAndUpdate(w.userId, {
      $inc: {
        withdrawnToday: Number(w.amount),
        totalWithdraw: Number(w.amount)
      }
    });

    w.status = "approved";
    await w.save();

    await Notification.create({
      userId: w.userId,
      title: "Withdrawal Successful",
      message: `Your withdrawal of $${w.amount} has been processed`,

       type: "TRANSACTION",           
       transactionType: "WITHDRAW" 
    });
  
    sendAdminUpdate("UPDATE_WITHDRAW", w);

    res.json({ message: "approved" });

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= REJECT =================
router.post("/:id/reject", async (req, res) => {
  try {
    const w = await Withdraw.findById(req.params.id);

    if (!w) {
      return res.status(404).json({ message: "Withdraw not found" });
    }

    if (w.status !== "pending") {
      return res.status(400).json({ message: "Invalid withdraw" });
    }

    // 🔥 คืนเงิน
    await User.findByIdAndUpdate(w.userId, {
      $inc: {
        balance: Number(w.amount)
      }
    });

    w.status = "rejected";
    await w.save();

    sendAdminUpdate("UPDATE_WITHDRAW", w);

    res.json({ message: "rejected & refunded" });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;