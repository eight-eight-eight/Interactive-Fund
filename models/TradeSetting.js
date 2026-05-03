const mongoose = require("mongoose");

const tradeSettingSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  symbol: {
    type: String,
    required: true
  },

  forceResult: {
    type: String,
    enum: ["win", "lose"],
    default: "lose"
  }

}, {
  timestamps: true
});


// 🔥 1 user มีได้ 1 setting ต่อ 1 symbol เท่านั้น
tradeSettingSchema.index(
  { userId: 1, symbol: 1 },
  { unique: true }
);


// 🔥 ช่วยให้ query หา asset ที่ "win" เร็วขึ้น
tradeSettingSchema.index(
  { userId: 1, forceResult: 1 }
);


module.exports = mongoose.model("TradeSetting", tradeSettingSchema);