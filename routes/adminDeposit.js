const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Withdraw = require("../models/WithdrawRequest");
const Notification = require("../models/Notification");
const { auth, adminOnly } = require("../middleware/authMiddleware");
router.use(auth, adminOnly);
// ================= GET ALL DEPOSITS =================
router.get("/list", async (req, res) => {
  const deposits = await Deposit.find().sort({ createdAt: -1 });
  res.json(deposits);
});

// ================= APPROVE =================
router.post("/approve/:id", async (req, res) => {
  console.log("🔥 APPROVE HIT");

  const deposit = await Deposit.findById(req.params.id);

  if (!deposit) {
    return res.status(404).json({ message: "Deposit not found" });
  }

  if (deposit.status === "approved") {
    return res.status(400).json({ message: "Already approved" });
  }

  if (deposit.status !== "pending") {
    return res.status(400).json({ message: "Invalid status" });
  }

  const amount = Number(deposit.amount);

  await User.updateOne(
    { _id: deposit.userId },
    {
      $inc: {
        balance: amount,
        totalDeposit: amount
      }
    }
  );

  deposit.status = "approved";
  await deposit.save();

  // 🔥 ย้ายมาไว้ตรงนี้
  await Notification.create({
    userId: deposit.userId,
    title: "Deposit Confirmed",
    message: `Your deposit of $${deposit.amount} has been credited`,

    type: "TRANSACTION",               
     transactionType: "DEPOSIT"         
  });

  sendAdminUpdate("UPDATE_DEPOSIT", deposit);

  res.json({ message: "Deposit approved" });
});
// ================= REJECT =================
router.post("/reject/:id", async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);

  if (!deposit) {
    return res.status(400).json({ message: "Not found" });
  }

  deposit.status = "rejected";
  await deposit.save();

  sendAdminUpdate("UPDATE_DEPOSIT", deposit);

  res.json({ message: "Deposit rejected" });
});


module.exports = router;