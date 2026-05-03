const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  userId: String,
  symbol: String,
  type: String, // BUY / SELL
  amount: Number,
  percent: Number,
  duration: Number,

  openPrice: Number,
  closePrice: Number,

  openTime: Date,
  closeTime: Date,

  status: {
    type: String,
    default: "open" // open / closed
  },

  result: String // win / lose
});

module.exports = mongoose.model("Trade", tradeSchema);