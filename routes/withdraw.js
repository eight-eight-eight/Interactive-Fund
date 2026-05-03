const express = require("express");
const router = express.Router();

const Withdraw = require("../models/WithdrawRequest");
const User = require("../models/User");

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const SECRET = process.env.JWT_SECRET || "SECRET";

// ================= AUTH =================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ================= CREATE WITHDRAW =================
router.post("/create", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      amount,
      address,
      network,
      bankName,
      accountNumber,
      accountName
    } = req.body;

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const user = await User.findById(req.userId).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.balance < amount) {
      throw new Error("Insufficient balance");
    }

    if (network === "BANK") {
      if (!bankName || !accountNumber || !accountName) {
        throw new Error("Bank info required");
      }
    } else {
      if (!address) {
        throw new Error("Wallet address required");
      }
    }

    // 🔥 หักเงิน
    user.balance -= Number(amount);
    await user.save({ session });

    // 🔥 สร้าง withdraw
    const withdraw = new Withdraw({
      userId: user._id,
      email: user.email,
      amount,
      network,
      address: address || "",
      bankName: bankName || "",
      accountNumber: accountNumber || "",
      accountName: accountName || "",
      status: "pending"
    });

    await withdraw.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ realtime (แก้ตรงนี้)
    if (global.sendAdminUpdate) {
      global.sendAdminUpdate("NEW_WITHDRAW", withdraw);
    }

    res.json({ message: "Withdraw request sent" });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("WITHDRAW ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;