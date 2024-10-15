const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("./admin.model.js");
const TelegramUsers = require("../models/user.model")
const Sending = require("../models/sending.model")
const BotsList = require("../models/bot.model")
const BotsGroup = require("../models/group.model")

const auth = require("./Middlewares/auth.js");
const dayjs = require("dayjs");
const fs = require("fs");
const cron = require("node-cron");
const {v4: uuidv4} = require("uuid");
const {createSecretToken} = require("../utils/SecretToken");
const path = require("path");
const isValidTelegramBotToken = require("../utils/isValidTelegramBotToken");
const Bot = require("../bot/bot");
const { JWT_SECRET } = process.env

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.json({ errorMessage: "Заповніть всі поля" });

        const existingAdmin = await Admin.findOne({ email: email});

        if (!existingAdmin)
            return res.json({ errorMessage: "Невірний email або password" });

        const isPasswordValid = await bcrypt.compare(password, existingAdmin?.passwordHash);

        if (!isPasswordValid)
            return res.json({ errorMessage: "Невірний email або password" });

        const token = createSecretToken(existingAdmin._id);

        res.cookie("token", token, {
            httpOnly: false
        }).status(201).json({ message: "Успішно авторизовано", success: true });
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
});

router.get("/userList",  async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.json(false);

        const adminlog = jwt.verify(token, JWT_SECRET);

        const admin = await Admin.find({_id: { $ne: adminlog.id }});
        res.json(admin);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/deleteUser",  async (req, res) => {
    try {
        const { id } = req.body;
        const token = req.cookies.token;
        if (!token) return res.json({entree:false});

        const adminlog = jwt.verify(token, JWT_SECRET);
        const adminDelete = await Admin.deleteOne({_id: { $ne: adminlog.id }, _id:id});
        res.json(true);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/logout", (req, res) => {
    try {
        res.clearCookie('token')
        res.status(201).json({ message: "User logged in successfully", success: true });
    }catch(e){
        res.status(500).send();
    }
});

router.get("/loggedIn", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.json({entree:false});

        jwt.verify(token, JWT_SECRET);
        const adminlog = jwt.verify(token, JWT_SECRET);

        const admin = await Admin.findOne({_id: adminlog.id},{entree:1,_id:0,root:1});

        res.send({adminInfo:admin.entree,entree:true,root:admin.root})
    } catch (err) {
        res.json(false);
    }
});


router.post("/",  async (req, res) => {
    try {

        const token = req.cookies.token

        if (!token) {
            return res.json({ status: false })
        }
        jwt.verify(token, JWT_SECRET, async (err, data) => {
            if (err) {
                return res.json({ status: false })
            } else {
                const user = await Admin.findById(data.id)
                if (user) return res.json({ status: true, user: user.email, root: user.root })
                else return res.json({ status: false })
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

// cron.schedule('* * * * *', async () => {
//
//     try {
//         const currentDate = new Date();
//
//         const twoMinutesAgo = new Date(currentDate);
//         twoMinutesAgo.setMinutes(currentDate.getMinutes() - 2);
//
//         const insertedData = await Sending.findOne({
//             date: {
//                 $lte: currentDate,
//             },
//             $or: [
//                 { viber: true, accepting_viber: false },
//                 { telegram: true, accepting_telegram: false },
//             ]
//         });
//
//         if(insertedData){
//             if(insertedData?.telegram && !insertedData?.accepting_telegram){
//                 if(insertedData?.type_sendings === 'Системна розсилка'){
//                     await sendingUsers.sendingUsers(insertedData._id,insertedData.content,insertedData.image,insertedData.watch,insertedData.type,insertedData.sending_users, insertedData.store_link,false)
//                 } else{
//                     await sendingUsers.sendingUsers(insertedData._id,insertedData.content,insertedData.image,insertedData.watch,insertedData.type,insertedData.sending_users, insertedData.store_link,true)
//                 }
//
//             }
//
//             if(insertedData?.viber && !insertedData?.accepting_viber){
//                 if(insertedData?.type_sendings === 'Системна розсилка'){
//                     await sendingUsersViber(insertedData._id,insertedData.content,insertedData.image,insertedData.watch,insertedData.type,insertedData.sending_users, insertedData.store_link,false)
//                 } else{
//                     await sendingUsersViber(insertedData._id,insertedData.content,insertedData.image,insertedData.watch,insertedData.type,insertedData.sending_users, insertedData.store_link,true)
//                 }
//             }
//         }
//     } catch(e){
//         console.error(e)
//     }
// })

// cron.schedule('0 */1 * * *', async () => {
//     try{
//         const currentDate = new Date();
//
//         const hourAgo = new Date(currentDate);
//         hourAgo.setHours(currentDate.getHours() + 1);
//         hourAgo.setMinutes(currentDate.getMinutes() + 30);
//
//         const insertedData = await Seminar.findOne({
//             date: {
//                 $lte: hourAgo,
//                 $gte: currentDate,
//             },
//             notification_hour: false
//         }, { _id: 1, date: 1, title: 1 });
//         if(insertedData){
//
//             const usersData = await RegisteredSeminar.find({seminar_id:insertedData._id}, {_id:0,chat_id:1})
//
//             let userList = []
//
//             const chatIds = usersData.map(user => user.chat_id);
//
//             for (const chatId of chatIds) {
//                 const users = await TelegramUsers.find({chat_id: chatId }, {_id:1});
//                 userList.push(...users);
//             }
//
//             const countTelegram = await TelegramUsers.countDocuments({_id: { $in: chatIds }, type: 'Telegram'});
//             const countViber = await TelegramUsers.countDocuments({_id: {$in:chatIds}, type: 'Viber'});
//
//             if(userList.length){
//                 const message_hour = await Answer.findOne({id_answer: 'seminar_notification_hour'},{_id:0,answerText:1});
//                 const replacedTextHour = message_hour.answerText
//                     .replace('{seminarData}', insertedData.title);
//
//
//                 const telegram_sending = countTelegram !== 0 ? true : false;
//                 const viber_sending = countViber !== 0 ? true : false;
//
//                 const date_hour = new Date(insertedData.date);
//                 date_hour.setHours(date_hour.getHours() - 1);
//
//                 const insertSending_hour = await Sending.insertMany({type_sendings:'Системна розсилка', date:date_hour,content:replacedTextHour,un_sending_telegram:countTelegram,un_sending_viber:countViber,sending_users:userList,viber:viber_sending,telegram:telegram_sending})
//                 const insertedDataUpdate = await Seminar.updateOne({_id:insertedData._id},{
//                     notification_hour:true
//                 })
//             }
//         }
//     }catch(e){
//         console.error(e)
//     }
// });
//
// cron.schedule('0 */2 * * *', async () => {
//     try{
//         const currentDate = new Date();
//
//         const hourAgo = new Date(currentDate);
//         hourAgo.setHours(currentDate.getHours() + 25);
//
//         const insertedData = await Seminar.findOne({
//             date: {
//                 $lte: hourAgo,
//                 $gte: currentDate,
//             },
//             notification_day: false
//         }, { _id: 1, date: 1, title: 1 });
//
//         if(insertedData){
//
//             const usersData = await RegisteredSeminar.find({seminar_id:insertedData._id}, {_id:0,chat_id:1})
//
//             let userList = []
//
//             const chatIds = usersData.map(user => user.chat_id);
//
//             for (const chatId of chatIds) {
//                 const users = await TelegramUsers.find({chat_id: chatId }, {_id:1});
//                 userList.push(...users);
//             }
//
//             const countTelegram = await TelegramUsers.countDocuments({chat_id: { $in: chatIds }, type: 'Telegram'});
//             const countViber = await TelegramUsers.countDocuments({chat_id: {$in:chatIds}, type: 'Viber'});
//
//             if(userList.length){
//                 const message_day = await Answer.findOne({id_answer: 'seminar_notification_day'},{_id:0,answerText:1});
//
//                 const replacedTextDay = message_day.answerText
//                     .replace('{seminarData}', insertedData.title);
//
//                 const telegram_sending = countTelegram !== 0 ? true : false;
//                 const viber_sending = countViber !== 0 ? true : false;
//
//                 const date_day = new Date(insertedData.date);
//
//                 date_day.setHours(date_day.getHours() - 24);
//                 const insertSending_day = await Sending.insertMany({type_sendings:'Системна розсилка',date:date_day,content:replacedTextDay,un_sending_telegram:countTelegram,un_sending_viber:countViber,sending_users:userList,viber:viber_sending,telegram:telegram_sending})
//                 const insertedDataUpdate = await Seminar.updateOne({_id:insertedData._id},{
//                     notification_day:true
//                 })
//             }
//         }
//     }catch(e){
//         console.error(e)
//     }
// });

// router.post("/createSending",  async (req, res) => {
//     try {
//         const {text, messanger, type, date, video, photo, users, store_link} = req.body
//
//         if(messanger){
//             let countTelegram,countViber, sendingsUsers = false;
//
//             const viber = messanger.includes("viber")
//             const telegram = messanger.includes("telegram")
//
//
//             if(users.length && users.includes('All')) {
//                 countTelegram = await TelegramUsers.countDocuments({type: 'Telegram'});
//                 countViber = await TelegramUsers.countDocuments({type: 'Viber'});
//             } else{
//                 sendingsUsers = true;
//                 countTelegram = await TelegramUsers.countDocuments({_id: {$in:users}, type: 'Telegram'});
//                 countViber = await TelegramUsers.countDocuments({_id: {$in:users}, type: 'Viber'});
//             }
//
//             if(date !== 'Invalid Date' && date !== null && date !== undefined && date !== ''){
//                const insertedData = await Sending.insertMany({type_sendings:'Ручна розсилка',date:date, content:text, type:type, sending_users:users, image:photo, watch: video, viber:viber, telegram:telegram, un_sending_telegram:countTelegram, un_sending_viber:countViber,store_link})
//             }else{
//                 const insertedData = await Sending.insertMany({type_sendings:'Ручна розсилка',content:text, type:type, sending_users:users, image:photo, watch: video, viber:viber, telegram:telegram, un_sending_telegram:countTelegram, un_sending_viber:countViber,store_link})
//
//                 if(telegram && viber){
//                     if(users.length && users.includes('All')){
//                         await sendingUsers.sendingUsers(insertedData[0]._id,text,photo,video,type, users,store_link, true)
//                         await sendingUsersViber(insertedData[0]._id,text,photo,video,type, users,store_link, true)
//                     } else{
//                         await sendingUsers.sendingUsers(insertedData[0]._id,text,photo,video,type, users,store_link, true)
//                         await sendingUsersViber(insertedData[0]._id,text,photo,video,type, users,store_link, true)
//                     }
//                 }else if(viber){
//                     if(users.length && users.includes('All')) {
//                         await sendingUsersViber(insertedData[0]._id, text, photo, video, type, users,store_link, true)
//                     }else{
//                         await sendingUsersViber(insertedData[0]._id, text, photo, video, type, users,store_link, true)
//                     }
//                 }else if(telegram){
//                     if(users.length && users.includes('All')) {
//                         await sendingUsers.sendingUsers(insertedData[0]._id, text, photo, video, type, users,store_link, true)
//                     }else{
//                         await sendingUsers.sendingUsers(insertedData[0]._id, text, photo, video, type, users,store_link, true)
//                     }
//                 }
//             }
//         }
//         res.json(true);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send();
//     }
// });

router.post("/removePhoto",  async (req, res) => {
    try {
        const {id} = req.body

        const imageUrl =  await Seminar.findOne({_id:id},{image: 1})

        if(imageUrl?.image){
            fs.unlink(`./uploads/image/${imageUrl?.image}`, (err) => {
                if (err) {
                    console.error('Помилка при видаленні фото:', err);
                }
            });
            await Seminar.updateOne({_id:id},{image: null})


        }

        const seminar= await Seminar.findOne({_id:id});
        res.json(seminar);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/sendingsDelete",  async (req, res) => {
    try {
        const {id} = req.body
        const sending_file = await Sending.findOne({_id:id});

        if(sending_file?.watch.length) {
            sending_file?.watch.map((item)=>
                fs.unlink(`./uploads/sending/${item}`, (err) => {
                    if (err) {
                        console.error('Помилка при видаленні відео:', err);
                    }
                })
            )
        }

        if(sending_file?.image.length) {
            sending_file?.image.map((item)=>
                fs.unlink(`./uploads/sending/${item}`, (err) => {
                    if (err) {
                        console.error('Помилка при видаленні фото:', err);
                    }
                })
            )
        }

        const sending= await Sending.deleteOne({_id:id});
        res.json(true);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get("/sendingsList",  async (req, res) => {
    try {
        const sending= await Sending.find({
            $or: [
                { accepting_viber: true },
                { accepting_telegram: true }
            ]
        }).sort({createdAt:-1});


        const localizedSeminar = sending.map((user) => {
            const localizedDateCreatedAt = dayjs(user.createdAt).locale('uk').format('DD.MM.YYYY HH:mm');
            const localizedDateUpdateAt = dayjs(user.updatedAt).locale('uk').format('DD.MM.YYYY HH:mm');
            const localizedDate = dayjs(user.date).locale('uk').format('DD.MM.YYYY HH:mm');
            return {
                ...user._doc,
                createdAt: localizedDateCreatedAt,
                updatedAt: localizedDateUpdateAt,
                date: localizedDate,
            };
        });

        res.json(localizedSeminar);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get("/sendingsListLoad",  async (req, res) => {
    try {
        const sending= await Sending.find({
            accepting_viber: false,
            accepting_telegram: false
        });

        const localizedSeminar = sending.map((user) => {
            const localizedDateCreatedAt = dayjs(user.createdAt).locale('uk').format('DD.MM.YYYY HH:mm');
            const localizedDateUpdateAt = dayjs(user.updatedAt).locale('uk').format('DD.MM.YYYY HH:mm');
            const localizedDate = dayjs(user.date).locale('uk').format('DD.MM.YYYY HH:mm');
            return {
                ...user._doc,
                createdAt: localizedDateCreatedAt,
                updatedAt: localizedDateUpdateAt,
                date: localizedDate,
            };
        });

        res.json(localizedSeminar);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});



router.get("/statistics",  async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
        );

        const endOfDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() + 1
        );

        const result = await TelegramUsers.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                },
            },
        ]);


        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/sendingsUserList",  async (req, res) => {
    try {
        const {type,messanger} = req.body
        if(type.includes('All')){

            const caseInsensitiveMessanger = messanger.map(value => new RegExp(value, 'i'));
            const messangerUsers = await TelegramUsers.find({
                type: {$in: caseInsensitiveMessanger}
            });

            const transformedArray = messangerUsers.map(item => ({
                value: `${item._id}`,
                name: `${item.userFirstName}`,
                phone: `${item.phone}`,
                city: `${item.userCity}`,
                type: `${item.type}`
            }));

            return res.json({data: transformedArray});
        } else if(!type.includes('All')){
            const caseInsensitiveMessanger = messanger.map(value => new RegExp(value, 'i'));
            const messangerUsers = await TelegramUsers.find({
                type: { $in: caseInsensitiveMessanger }, direction:{$in:type }
            });

            const transformedArray = messangerUsers.map(item => ({
                value: `${item._id}`,
                name: `${item.userFirstName}`,
                phone: `${item.phone}`,
                city: `${item.userCity}`
            }));

            return res.json({data: transformedArray});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get("/getBotList",  async (req, res) => {
    try {
        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        const botList = await BotsList.find({})

        res.json(botList);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/createBot",  async (req, res) => {
    try {
        const { token, name } = req.body;
        const Bot = require('../bot/bot');

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(token !== null && isValidTelegramBotToken(token) && token){
            try{
                const findBot = await BotsList.findOne({token})
                if(!findBot){
                    const bot = new Bot(token);
                    bot.launch().catch();
                    await BotsList.insertMany({name,token})
                    res.json({status:true,user_message: 'Бота успішно додано'});
                } else{
                    res.json({status:false,user_message: 'Бот уже існує'});
                }

            } catch (e){
                console.error(e)
                res.json({status:false,user_message: 'Виникла помилка під час запуску бота'});
            }
        } else {
            res.json({status:false,user_message: 'невірний АРІ токен'});
        }

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/getBotData",  async (req, res) => {
    try {
        const { id } = req.body;
        const Bot = require('../bot/bot');

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(id !== null && id){
            try{
                const botData = await BotsList.findOne({_id:id});
                const botGroup = await BotsGroup.find({chat_id_bot: botData?.chat_id, thread_id:'main'})

                let groupFind = []

                for(const currentGroup of botGroup){
                    if(currentGroup?.working){
                        groupFind.push({_id:currentGroup?._id,name:currentGroup?.name, working:true})
                    } else {
                        const botGroup = await BotsGroup.findOne({chat_id: currentGroup?.chat_id, working:true})

                        if(botGroup)
                            groupFind.push({_id:currentGroup?._id,name:currentGroup?.name, working:true})
                        else
                            groupFind.push({_id:currentGroup?._id,name:currentGroup?.name, working:false})
                    }
                }

                res.json({status: true, botData: botData, botGroup: groupFind});
            } catch (e){
                console.error(e)
                res.json({status:false,user_message: 'Виникла помилка під час запуску бота'});
            }
        } else {
            res.json({status:false,user_message: 'Бота не знайдено в базі даних'});
        }

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});


router.post("/reloadBot",  async (req, res) => {
    try {
        const { id } = req.body;
        const Bot = require('../bot/bot');

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(id !== null && id){
            try{
                const botData = await BotsList.findOne({_id:id});

                const bot = new Bot(botData?.token);
                await bot.stopBot();

                res.json({status: true, botData: botData});
            } catch (e){
                console.error(e)
                res.json({status:false,user_message: 'Виникла помилка під час запуску бота'});
            }
        } else {
            res.json({status:false,user_message: 'Бота не знайдено в базі даних'});
        }

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});




module.exports = router;