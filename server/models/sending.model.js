const mongoose = require("mongoose");

const SendingList = new mongoose.Schema({
    date: {
        type: Date,
    },
    content:{
        type: String,
    },
    bot_id:{
        type: String,
    },
    file_id:{
        type: String,
        default: ''
    },
    group:{
        type: Array,
        default: null
    },
    image:{
        type: Array,
        default: null
    },
    watch:{
        type: Array,
        default: null
    },
    accepting_telegram:{
        type: Boolean,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
},{ timestamps: true })

const Sendings = mongoose.model("sending_list", SendingList);

module.exports = Sendings;