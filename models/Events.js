//event model

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
event_name: String, 
event_URL: String,
event_start_date: Date, 
event_duration: Number,
event_end_date: Date,
event_pic: String,
group: String, //id of group which booked the event
event_description: String,
event_location: String,
event_platform: String,
meeting_URL: String, //for online events
max_attendees: Number,
admin: String,
hosts: Array, 
attendees: Array,
channel: String,
created_date: Date,
owner: String
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event