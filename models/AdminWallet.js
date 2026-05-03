const mongoose = require("mongoose");

const adminWalletSchema = new mongoose.Schema({
  type: { type: String, enum: ["crypto", "bank"], required: true },

  // Crypto
  network: String,
  address: String,

  // Bank
  bankName: String,
  accountNumber: String,
  accountName: String,

  status: { type: String, default: "active" }

}, { timestamps: true });

module.exports = mongoose.model("AdminWallet", adminWalletSchema);