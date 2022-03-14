//user model

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
email: String,
password: String,
created_date: Date,
updated_date: Date,
role: String
});

const User = mongoose.model("User",userSchema);

module.exports = User