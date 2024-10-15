const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const BotModel = require('../models/bot.model');
const BotGroupModel = require('../models/group.model');
const BotHashTagsModel = require('../models/hashtag.model');
class Bot {
    constructor(token) {
        this.token = token;
        this.bot = new Telegraf(token);
        this.setupCommands();
        this.setupEventHandlers();
    }

    setupCommands() {
        this.bot.command('start', this.handleStart.bind(this));
    }

    setupEventHandlers() {
        this.bot.on(message, this.handleMessage.bind(this));
    }

    async init() {
        try {

            // const existingBot = await BotModel.findOne({ token: this.token });
            // if (!existingBot) {
            //     console.log(`Бот з токеном ${this.token.slice(0, 10)}... не знайдено в базі даних.`);
            //     await BotModel.updateOne(
            //         { token: this.token },
            //         {
            //             active: false
            //         }
            //     );
            //     return false;
            // }

            const botInfo = await this.bot.telegram.getMe().catch();
            this.id = botInfo.id;
            this.username = botInfo.username;
            this.first_name = botInfo.first_name;

            await BotModel.updateOne(
                { token: this.token },
                {
                    chat_id: this.id,
                    username: this.username,
                    first_name: this.first_name,
                    active: true,
                }
            );

            return true;
        } catch (error) {
            console.error('Помилка при ініціалізації бота:', error);
            return false;
        }
    }

    async handleStart(ctx) {
        try {

            return false
        } catch (e) {
            console.error(e);
        }
    }

    async handleMessage(ctx) {
        try {

            if(ctx?.update?.message || ctx?.update?.my_chat_member){
                const {status} = await BotModel.findOne({chat_id: ctx?.update?.message?.chat?.id})
                console.log(status)
                if(!status) return false

                if(ctx?.update?.message?.left_chat_member?.id === this.id){

                    await BotGroupModel.updateOne({
                        chat_id: ctx?.update?.message?.chat?.id,
                        chat_id_bot: this.id,
                    }, {working: false} )
                } else if(ctx?.update?.message?.new_chat_member?.id === this.id){

                    const checkMainGroup = await BotGroupModel.findOne({chat_id: ctx?.update?.message?.chat?.id, chat_id_bot: this.id})

                    if(!checkMainGroup)
                        await BotGroupModel.insertMany({
                            chat_id: ctx?.update?.message?.chat?.id,
                            thread_id: 'main',
                            chat_id_bot: this.id,
                            name: ctx?.update?.message?.chat?.title,
                            working: false,
                            main: true,
                        })
                    else
                        await BotGroupModel.updateOne({
                            chat_id: ctx?.update?.message?.chat?.id,
                            chat_id_bot: this.id,
                        }, {working: false})

                    if(ctx?.update?.my_chat_member?.new_chat_member?.status === 'administrator')
                        await BotGroupModel.updateOne({
                            chat_id: ctx?.update?.my_chat_member?.chat?.id,
                            chat_id_bot: this.id,
                            thread_id: 'main',
                        }, {working:true})

                    if(ctx?.update?.my_chat_member?.new_chat_member?.status === 'member')
                        await BotGroupModel.updateOne({
                            chat_id: ctx?.update?.my_chat_member?.chat?.id,
                            chat_id_bot: this.id,
                        }, {working:false})

                } else if(ctx?.update?.my_chat_member?.new_chat_member?.status === 'administrator' || ctx?.update?.my_chat_member?.new_chat_member?.status === 'member'){

                    if(ctx?.update?.my_chat_member?.new_chat_member?.status === 'administrator')
                        await BotGroupModel.updateOne({
                            chat_id: ctx?.update?.my_chat_member?.chat?.id,
                            chat_id_bot: this.id,
                            thread_id: 'main',
                        }, {working:true})
                    else if(ctx?.update?.my_chat_member?.new_chat_member?.status === 'member')
                        await BotGroupModel.updateOne({
                            chat_id: ctx?.update?.my_chat_member?.chat?.id,
                            chat_id_bot: this.id,
                        }, {working:false})
                } else if(ctx?.update?.message?.message_thread_id && ctx?.update?.message?.is_topic_message){

                    const groups = await BotGroupModel.findOne({chat_id: ctx?.update?.message?.chat?.id, thread_id: ctx?.update?.message?.message_thread_id})
                    if(groups){

                        if(groups?.working && ctx?.update?.message?.text){
                            const hashtag = parseHashtags(ctx?.update?.message?.text)
                            if(hashtag && hashtag.length)
                                for (const item of hashtag) {
                                    await BotHashTagsModel.insertMany({
                                        chat_id: ctx?.update?.message?.chat?.id,
                                        thread_id: ctx?.update?.message?.message_thread_id,
                                        chat_id_bot: this.id,
                                        chat_id_user: ctx?.update?.message?.from?.id,
                                        username: ctx?.update?.message?.from?.username,
                                        first_name: ctx?.update?.message?.from?.first_name,
                                        hashtag: item,
                                    });
                                }
                        }

                    } else {

                        const checkMainGroup = await BotGroupModel.findOne({chat_id: ctx?.update?.message?.chat?.id, main: true})

                        if(!checkMainGroup)
                            await BotGroupModel.insertMany({
                                chat_id: ctx?.update?.message?.chat?.id,
                                thread_id: 'main',
                                chat_id_bot: this.id,
                                name: ctx?.update?.message?.chat?.title,
                                working: true,
                                main: true,
                            })

                        await BotGroupModel.insertMany({
                            chat_id: ctx?.update?.message?.chat?.id,
                            thread_id: ctx?.update?.message?.message_thread_id,
                            chat_id_bot: this.id,
                            name: ctx?.update?.message?.reply_to_message?.forum_topic_created?.name,
                            working: true,
                            main: false,
                        })

                        if(ctx?.update?.message?.text){
                            const hashtag = parseHashtags(ctx?.update?.message?.text)
                            if(hashtag && hashtag.length)
                                for (const item of hashtag) {
                                    await BotHashTagsModel.insertMany({
                                        chat_id: ctx?.update?.message?.chat?.id,
                                        thread_id: ctx?.update?.message?.message_thread_id,
                                        chat_id_bot: this.id,
                                        chat_id_user: ctx?.update?.message?.from?.id,
                                        username: ctx?.update?.message?.from?.username,
                                        first_name: ctx?.update?.message?.from?.first_name,
                                        hashtag: item,
                                    });
                                }
                        }
                    }
                } else {
                    const checkMainGroup = await BotGroupModel.find({chat_id: ctx?.update?.message?.chat?.id, main: true})

                    if(!checkMainGroup)
                        await BotGroupModel.insertMany({
                            chat_id: ctx?.update?.message?.chat?.id,
                            thread_id: 'main',
                            chat_id_bot: this.id,
                            name: ctx?.update?.message?.chat?.title,
                            working: true,
                            main: true,
                        })

                    if(ctx?.update?.message?.text){
                        const hashtag = parseHashtags(ctx?.update?.message?.text)
                        if(hashtag && hashtag.length)
                            for (const item of hashtag) {
                                await BotHashTagsModel.insertMany({
                                    chat_id: ctx?.update?.message?.chat?.id,
                                    thread_id: 'main',
                                    chat_id_bot: this.id,
                                    chat_id_user: ctx?.update?.message?.from?.id,
                                    username: ctx?.update?.message?.from?.username,
                                    first_name: ctx?.update?.message?.from?.first_name,
                                    hashtag: item,
                                });
                            }
                    }
                }
            }

            function parseHashtags(text) {
                if(text && text !== null){
                    const hashtagRegex = /(^|\s)(#[\wа-яА-ЯіїєґІЇЄҐ]+)/gu;
                    const matches = text.matchAll(hashtagRegex);
                    return Array.from(matches, m => m[2]);
                }
            }

        } catch (e) {
            console.error(e);
        }
    }

    async stopBot() {
        try {
            // console.log(this.token)
            // console.log(this.bot.)
            // console.log(this.bot.stop())
                await this.bot.stop();
                // process.once('SIGINT', () => this.bot.stop('SIGINT'));
                // process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
                console.log(`Бот з токеном ${this.token.slice(0, 10)}... успішно зупинений.`);
                await BotModel.updateOne(
                    {token: this.token},
                    {active: false}
                );

        } catch (error) {
            console.error('Помилка при зупинці бота:', error);
        }
    }

    async launch() {
        try {
            const initialized = await this.init();
            console.log(initialized)
            if (!initialized) {
                console.log(`Не вдалося ініціалізувати бота з токеном: ${this.token.slice(0, 10)}...`);
                await BotModel.updateOne(
                    { token: this.token },
                    {
                        active: false
                    }
                );
                return;
            }

            await this.bot.launch();
            console.log(`Бот успішно запущений з токеном: ${this.token.slice(0, 10)}...`);
            await BotModel.updateOne(
                { token: this.token },
                {
                    active: true,
                }
            );
        } catch (error) {
            if (error.description === 'Unauthorized') {
                console.error(`Помилка авторизації: Невірний API ключ для бота з токеном ${this.token.slice(0, 10)}...`);
                await BotModel.updateOne(
                    { token: this.token },
                    {
                        active: false
                    }
                );
            } else {
                console.error('Помилка при запуску бота:', error);
                await BotModel.updateOne(
                    { token: this.token },
                    {
                        active: false
                    }
                );
            }
        }

    }
}

module.exports = Bot;