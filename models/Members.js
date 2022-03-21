//member model

const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
first_name: String,
last_name: String,
profile_pic: String,
member_URL: String,
country: String,
native_language: String,
fluent_languages: Array,
learning_languages: Array,
about_me: String,
joined_groups: Array,
admin_groups: Array,
admin_events: Array,
host_events: Array,
rsvp_events: Array,
group_chats: Array, // group channels
event_chats: Array, // event channels
private_chats: Array, // private channels
created_date: Date,
owner: String
});

const Member = mongoose.model("Member",memberSchema);

module.exports = Member