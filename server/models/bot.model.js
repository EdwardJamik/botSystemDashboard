const mongoose = require("mongoose");

const botSchema = new mongoose.Schema({
    chat_id: {
        type: String,
    },
    username: {
        type: String,
    },
    first_name: {
        type: String,
    },
    name: {
        type: String,
    },
    token: {
        type: String,
        unique: true,
    },
    active: {
        type: Boolean,
    },
    status: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    },
},{ timestamps: true })

module.exports = mongoose.model('Bot', botSchema)

