const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  userId: String,
  email: String,

  amount: Number,
  network: String,

  // 🔹 crypto
  address: {
    type: String,
    default: ""
  },

  // 🔥 BANK (สำคัญมาก)
  bankName: {
    type: String,
    default: ""
  },

  accountNumber: {
    type: String,
    default: ""
  },

  accountName: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("WithdrawRequest", withdrawSchema);