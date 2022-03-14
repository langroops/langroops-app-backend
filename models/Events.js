//event model

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
event_name: String, 
event_URL: String,
event_start_date: Date, 
event_pic: String,
admin: String,
hosts: Array, 
attendees: Array,
channel: String,
created_date: Date,
owner: String
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event