const express = require("express");
const router = express.Router();
const Wallet = require("../models/WithdrawWallet");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "SECRET";

// ================= AUTH =================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, SECRET);

    // 🔥 สำคัญ: ต้องตรงกับตอน login
    req.userId = decoded.userId || decoded.id;

    if (!req.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();

  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ================= ADD WALLET =================
router.post("/add", auth, async (req, res) => {
  try {
    const { 
  address, 
  network, 
  label,
  bankName,
  accountNumber,
  accountName
} = req.body;

    if (!network) {
  return res.status(400).json({ message: "Missing network" });
}

// 🔥 ถ้าเป็น crypto ต้องมี address
if (network !== "BANK" && !address) {
  return res.status(400).json({ message: "Missing address" });
}

// 🔥 ถ้าเป็น BANK ต้องมีข้อมูล bank
if (network === "BANK") {
  if (!accountNumber || !accountName || !bankName) {
    return res.status(400).json({ message: "Missing bank info" });
  }
}

    const wallet = new Wallet({
  userId: req.userId,
  address,
  network,
  label: label || "My Wallet",

  // 🔥 เพิ่มตรงนี้
  bankName,
  accountNumber,
  accountName
});

    await wallet.save();

    console.log("✅ WALLET SAVED:", wallet);

    res.json({
      message: "Wallet saved",
      wallet
    });

  } catch (err) {
    console.error("ADD WALLET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET WALLETS =================
router.get("/", auth, async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.userId }).sort({ createdAt: -1 });

    console.log("📦 GET WALLETS:", wallets.length);

    res.json(wallets);

  } catch (err) {
    console.error("GET WALLET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE WALLET (เผื่อใช้) =================
router.delete("/:id", auth, async (req, res) => {
  try {
    await Wallet.deleteOne({
      _id: req.params.id,
      userId: req.userId
    });

    res.json({ message: "Wallet deleted" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;