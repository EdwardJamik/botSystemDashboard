const mongoose = require("mongoose");

const telegramUserScheme = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true,
        unique:true,
    },
    username:{
        type: String,
    },
    first_name:{
        type: String,
    },
    phone:{
        type: String,
        required: false,
        default:null,
    },
    userFirstName:{
        type: String,
    },
    userCity:{
        type: String,
    },
    ban:{
        type: Boolean,
        default:false,
    },
    type:{
        type: String,
        enum: ['Viber', 'Telegram'],
    },
    direction:{
        type: String,
        enum: ['Cosmetology', 'Hairdressing', 'Other'],
        default:'Other'
    },
    invite:{
        type: String,
    },
    action:{
        type: String,
        required: true,
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

const UserList = mongoose.model("telegram_users", telegramUserScheme);

module.exports = UserList;