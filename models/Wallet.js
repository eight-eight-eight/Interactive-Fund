const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  type: {
    type: String, // bank | crypto
    required: true
  },

  // ===== BANK =====
  bankName: String,
  accountNumber: String,
  accountName: String,

  // ===== CRYPTO =====
  network: String,
  address: String,

  // ===== STATUS =====
  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema, "adminwallets");
