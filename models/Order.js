const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  // 👤 ผู้ใช้
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 📊 สินทรัพย์
  symbol: {
    type: String,
    required: true
  },

  // 📈 BUY / SELL
  type: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true
  },

  // 💰 จำนวนเงิน
  amount: {
    type: Number,
    required: true
  },

  // 📊 % กำไร
  percent: {
    type: Number,
    required: true
  },

  // ⏱ เวลา (นาที)
  duration: {
    type: Number,
    required: true
  },

  // 📊 ราคา
  openPrice: {
    type: Number,
    required: true
  },

  closePrice: {
    type: Number,
    default: null
  },

  // ⏱ เวลา
  openTime: {
    type: Date,
    default: Date.now
  },

  closeTime: {
    type: Date,
    default: null
  },

  // 📌 สถานะ
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  },

  // 🏁 ผลลัพธ์
  result: {
    type: String,
    enum: ["win", "lose"],
    default: null
  }

}, {
  timestamps: true
});


// 🔥 เร็วขึ้นเวลา query order ของ user
orderSchema.index({ userId: 1, status: 1 });

// 🔥 ใช้ตอนทำ auto close ในอนาคต
orderSchema.index({ status: 1, openTime: 1 });


module.exports = mongoose.model("Order", orderSchema);