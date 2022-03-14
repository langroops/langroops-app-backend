//chat model

const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
channel_id: String,
sender_id: String,
content: String,
image: String,
audio: String,
status: String, //"deleted" , "edited"
created_date: Date,
updated_date: Date
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat