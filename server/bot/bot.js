const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const BotModel = require('../models/bot.model');
const BotGroupModel = require('../models/group.model');
const BotHashTagsModel = require('../models/hashtag.model');
const Sending = require('../models/sending.model')
const Gallery = require('../models/gallery.model')
const fs = require("fs");
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
                    status:true
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
            console.log('START')
            return false
        } catch (e) {
            console.error(e);
        }
    }

    async handleMessage(ctx) {
        try {


            if(ctx?.update?.message?.video){
                const file_id = ctx?.update?.message?.video?.file_id
                const file_name = ctx?.update?.message?.video?.file_name
                const chat_id = ctx?.update?.message?.chat?.id
                const chat_id_bot = ctx?.botInfo?.id
                if(chat_id === 1088703199 || chat_id === 593682738) {
                    this.bot.telegram.sendMessage(chat_id,`*${file_name}*`, {parse_mode:'Markdown'})
                    await Gallery.insertMany({chat_id, chat_id_bot, file_name, file_id})
                }
            }

            if(ctx?.update?.message || ctx?.update?.my_chat_member){
                const checkStatus = await BotModel.findOne({chat_id: this.id})

                if(!checkStatus?.status) return false

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
                        if(groups?.working && ctx?.update?.message?.text || groups?.working && ctx?.update?.message?.caption){
                            const hashtag = ctx?.update?.message?.text ? parseHashtags(ctx?.update?.message?.text) : parseHashtags(ctx?.update?.message?.caption)
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

                        if(ctx?.update?.message?.text || ctx?.update?.message?.caption){
                            const hashtag = ctx?.update?.message?.text ? parseHashtags(ctx?.update?.message?.text) : parseHashtags(ctx?.update?.message?.caption)
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

                    if(ctx?.update?.message?.text || ctx?.update?.message?.caption){
                        const hashtag = ctx?.update?.message?.text ? parseHashtags(ctx?.update?.message?.text) : parseHashtags(ctx?.update?.message?.caption)
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
                console.log(`Бот з токеном ${this.token.slice(0, 10)}... успішно зупинений.`);
                await BotModel.updateOne(
                    {token: this.token},
                    {active: false,status:false}
                );

        } catch (error) {
            console.error('Помилка при зупинці бота:', error);
        }
    }

    async sendingGroup(id, file_id, chat_id, thread_id, message, image, video) {
        try {
            await Sending.updateOne({_id: id}, {accepting_telegram: true});

            if (message && image !== null && image?.length && image !== '') {
                if (image?.length === 1) {
                    const photoPath = `./uploads/sending/${image[0]}`;

                    try {
                        await this.bot.telegram.sendPhoto(chat_id, { source: fs.createReadStream(photoPath) }, {
                            caption: message,
                            parse_mode: 'Markdown',
                            message_thread_id: thread_id
                        });
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    const media = image.map((photoPath) => ({
                        type: 'photo',
                        media: { source: fs.createReadStream(`./uploads/sending/${photoPath}`) },
                    }));

                    try {
                        await this.bot.telegram.sendMediaGroup(chat_id, media, {
                            parse_mode: 'Markdown',
                            message_thread_id:thread_id
                        }).then(async () => {
                            await this.bot.telegram.sendMessage(chat_id, message, {
                                parse_mode: 'Markdown',
                                message_thread_id:thread_id
                            });
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
            } else if (message && video !== null && video?.length && video !== '' || file_id && file_id?.length && file_id !== '') {
                if (video?.length === 1 || file_id !== '') {
                    const videoPath = `./uploads/sending/${video}`;
                    try {

                        if(file_id && file_id?.length && file_id !== ''){
                            await this.bot.telegram.sendVideo(chat_id, file_id, {
                                caption: message,
                                parse_mode: 'Markdown',
                                message_thread_id: thread_id,
                            });
                        } else {
                            await this.bot.telegram.sendVideo(chat_id, { source: fs.createReadStream(videoPath) }, {
                                caption: message,
                                parse_mode: 'Markdown',
                                message_thread_id: thread_id,
                            });
                        }

                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    const media = video.map((videoPath, index) => ({
                        type: 'video',
                        media: { source: fs.createReadStream(`./uploads/sending/${videoPath}`) },
                        ...(index === 1 ? {caption: message} : {}),
                    }));

                    try {
                        await this.bot.telegram.sendMediaGroup(chat_id, media, {
                            parse_mode: 'Markdown',
                            message_thread_id: thread_id
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
            } else {
                try {
                    await this.bot.telegram.sendMessage(chat_id, message, {
                        parse_mode: 'Markdown',
                        message_thread_id: thread_id
                    });
                } catch (e) {
                    console.error(e);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    async launch() {
        try {
            const initialized = await this.init();

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
                    status: true
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