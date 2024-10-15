require('dotenv').config();
const BotModel = require('./models/bot.model');
const Bot = require('./bot/bot');
const isValidTelegramBotToken = require("./utils/isValidTelegramBotToken");

async function main() {

    const botTokens = await BotModel.find({status:true});

    botTokens.forEach(({ token }) => {
        if(token !== null && isValidTelegramBotToken(token) && token){
            const bot = new Bot(token);
            bot.launch();

        }
    });
}

main().catch(console.error);
