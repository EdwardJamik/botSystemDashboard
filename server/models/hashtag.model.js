const mongoose = require("mongoose");

const hashtagsSchema = new mongoose.Schema({
    chat_id: {
        type: String,
    },
    thread_id: {
        type: String,
    },
    chat_id_bot: {
        type: String,
    },
    chat_id_user: {
        type: String,
    },
    username: {
        type: String,
    },
    first_name: {
        type: String,
    },
    hashtag: {
        type: String,
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    },
},{ timestamps: true })

module.exports = mongoose.model('hashtags', hashtagsSchema)

