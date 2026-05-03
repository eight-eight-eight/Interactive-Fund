const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,

  role: {
    type: String,
    default: "user"
  },

  username: {
    type: String,
    default: "User"
  },

  vaultId: {
    type: String,
    unique: true
  },

  // ===== WALLET =====
  balance: { type: Number, default: 0 },
  totalDeposit: { type: Number, default: 0 },
  withdrawnToday: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },

  // 🔥 KYC SYSTEM
  kyc: {
    status: { type: String, default: "pending" },
    nationality: String,
    fullName: String,
    address: String,
    idNumber: String,
    frontImage: String,
    backImage: String,
  }
});

module.exports = mongoose.model("User", userSchema);