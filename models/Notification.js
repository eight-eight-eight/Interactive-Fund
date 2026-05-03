const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: String,

  title: String,
  message: String,

  // 🔥 หมวดหลัก
  type: {
    type: String,
    enum: ["TRANSACTION", "SYSTEM", "PROMOTION", "SECURITY"],
    default: "SYSTEM"
  },

  // 🔥 แยกเงินเข้า / ออก
  transactionType: {
    type: String,
    enum: ["DEPOSIT", "WITHDRAW", null],
    default: null
  },

  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);