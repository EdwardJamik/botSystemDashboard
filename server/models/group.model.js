const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    chat_id: {
        type: String,
    },
    thread_id: {
        type: String,
    },
    chat_id_bot: {
        type: String,
    },
    name: {
        type: String,
        required:true,
    },
    working: {
        type: Boolean,
    },
    main: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    },
},{ timestamps: true })

module.exports = mongoose.model('Group', groupSchema)

