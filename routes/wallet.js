const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Wallet = require("../models/Wallet");

// ❗ ถ้ายังไม่มีไฟล์ WithdrawRequest → comment ไว้ก่อน
let Withdraw;
try {
  Withdraw = require("../models/WithdrawRequest");
} catch {
  console.log("⚠️ Withdraw model not found (skip withdraw)");
}

// ================= AUTH =================
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "SECRET";

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, SECRET);

    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (err) {
    console.log("❌ AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ================= GET BALANCE =================
router.get("/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      balance: user.balance || 0,
      totalDeposit: user.totalDeposit || 0,
      withdrawnToday: user.withdrawnToday || 0
    });

  } catch (err) {
    console.error("BALANCE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// ================= WITHDRAW =================
router.post("/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.userId);

    if ((user.balance || 0) < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.balance = (user.balance || 0) - Number(amount);
    user.withdrawnToday = (user.withdrawnToday || 0) + Number(amount);

    await user.save();

    res.json({
      message: "Withdraw success",
      balance: user.balance
    });

  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= TRANSACTIONS =================
router.get("/transactions", auth, async (req, res) => {
  try {
    const userId = req.userId;

    // ===== DEPOSIT =====
    const deposits = await Deposit.find({ userId });

    const depositTx = deposits.map(d => ({
      type: "deposit",
      amount: d.amount,
      status: d.status, // pending | approved | rejected
      createdAt: d.createdAt
    }));

    // ===== WITHDRAW (optional) =====
    let withdrawTx = [];

    if (Withdraw) {
      const withdrawals = await Withdraw.find({ userId });

      withdrawTx = withdrawals.map(w => ({
        type: "withdraw",
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt
      }));
    }

    // ===== MERGE + SORT =====
    const all = [...depositTx, ...withdrawTx]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(all);

  } catch (err) {
    console.error("TRANSACTION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

function adminOnly(req, res, next) {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}


// 🔐 ADMIN ต้องอยู่ก่อน
router.get("/admin/all", auth, adminOnly, async (req, res) => {
  try {
    const wallets = await Wallet.find();
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// 🔓 USER (ต้องอยู่ล่างสุด)
router.get("/:method", async (req, res) => {
  try {
    const { method } = req.params;

    const wallets = await Wallet.find({ type: method });

    res.json(wallets);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;