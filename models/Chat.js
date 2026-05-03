const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },

  sender: { 
    type: String, 
    enum: ["user", "admin"], 
    required: true 
  },

  message: { 
    type: String,
    default: ""
  },

  image: { 
    type: String,
    default: ""
  },

  copyLabel: {
    type: String,
    default: ""
  },

  copyText: {
    type: String,
    default: ""
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

module.exports = mongoose.model("Chat", chatSchema);