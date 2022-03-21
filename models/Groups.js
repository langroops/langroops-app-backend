//group model

const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
group_name: String, 
group_type: String,
group_URL: String,
group_pic: String, 
group_privacy: String,
group_languages: Array,
admin: String, 
members: Array,
channel: String,
created_date: Date,
owner: String
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group