const mongoose = require('mongoose');

const userScheme = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    company: String
});

module.exports = mongoose.model("User", userScheme);