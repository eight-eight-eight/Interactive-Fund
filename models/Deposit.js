const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  userId: String,
  email: String,

  amount: Number,
  method: String, // bank | crypto

  // 🔥 เพิ่มสลิป
  slip: String,

  status: {
    type: String,
    default: "pending" // pending | approved | rejected
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Deposit", depositSchema);