const mongoose = require('mongoose');

const channelScheme = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    ownerArray: [{ type: 'ObjectId', ref: 'User', required: true }],
    streams: [
        {
            name: {type: String, required: true},
            addDate: {type: Date, default: Date.now}
        }
    ]
});

module.exports = mongoose.model("Channel", channelScheme);