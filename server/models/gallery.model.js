const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
    chat_id: {
        type: String,
    },
    file_name: {
        type: String,
    },
    file_id: {
        type: String,
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    },
},{ timestamps: true })

module.exports = mongoose.model('Gallery', gallerySchema)

