//channel model

const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
channel_type: String, // "group", "event", "private"
channel_name: String,
channel_pic: String,
members_id: Array, //if private channel
group_id: String, //if group channel
event_id: String, //if event channel
read_by: Array,
admin: String
});

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel