const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    unique: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Asset", assetSchema);