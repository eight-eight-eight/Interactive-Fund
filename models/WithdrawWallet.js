const mongoose = require("mongoose");

const withdrawWalletSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true
  },

  // 🔹 crypto
  address: {
    type: String,
    default: ""
  },

  // 🔹 network (ERC20 / TRC20 / BANK)
  network: {
    type: String,
    required: true
  },

  label: {
    type: String,
    default: "My Wallet"
  },

  // 🔥 BANK FIELDS
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
  }

}, { timestamps: true });

module.exports = mongoose.model("WithdrawWallet", withdrawWalletSchema);