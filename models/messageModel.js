const mongoose = require("mongoose");

// Schema to store messages
const messageSchema = new mongoose.Schema({
    roomId: String,
    text: String,
    senderId: { type: mongoose.Schema.ObjectId, ref: "users", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  });
  
module.exports = new mongoose.model("Message", messageSchema);