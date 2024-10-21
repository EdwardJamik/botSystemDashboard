const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("./admin.model.js");
const TelegramUsers = require("../models/user.model")
const Sending = require("../models/sending.model")
const BotsList = require("../models/bot.model")
const BotsGroup = require("../models/group.model")
const BotHashTags = require("../models/hashtag.model")
const Gallery = require("../models/gallery.model")

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

cron.schedule('* * * * *', async () => {

    try {

        const currentDate = new Date();

        const twoMinutesAgo = new Date(currentDate);
        twoMinutesAgo.setMinutes(currentDate.getMinutes() - 2);

        const insertedData = await Sending.findOne({
            date: {
                $lte: currentDate,
            },
            $or: [
                { accepting_telegram: false },
            ]
        });

        if(insertedData){
            if(!insertedData?.accepting_telegram){
                const findBot = await BotsList.findOne({_id: insertedData?.bot_id})
                const bot = new Bot(findBot?.token);

                for(const currentGroup of insertedData?.group){
                    await bot.sendingGroup(String(insertedData?._id), insertedData?.file_id,currentGroup[0],currentGroup[1],insertedData?.content,insertedData?.image,insertedData?.watch)
                }
            }
        }
    } catch(e){
        console.error(e)
    }
})

router.post("/createSending",  async (req, res) => {
    try {
        const {text, group, bot_id, date, video, photo, file_id} = req.body

        if(text && group || video && group || photo && group || file_id && group){

            if(date === 'Invalid Date' || date === null || date === undefined || date === ''){
                const findBot = await BotsList.findOne({_id: bot_id})
                const bot = new Bot(findBot?.token);

                const insertedData = await Sending.insertMany({bot_id, file_id: file_id?.length ? file_id : '', group, content:text, image:photo, watch: video})

                for(const currentGroup of group){
                    await bot.sendingGroup(String(insertedData[0]?._id),file_id,currentGroup[0],currentGroup[1],text,photo,video)
                }
            } else {
                const insertedData = await Sending.insertMany({date:date, file_id: file_id?.length ? file_id : '', content:text, bot_id, group, image:photo, watch: video })
            }
        }
        res.json(true);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

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

router.post("/sendingsGroupList",  async (req, res) => {
    try {
        const {bot_id} = req.body

        const currentBot = await BotsList.findOne({ _id: bot_id });
        const groupList = await BotsGroup.find({
            chat_id_bot: currentBot?.chat_id
        }).sort({ chat_id: 1 }); // Сортуємо за chat_id

        const mainGroups = groupList.filter(item => item.thread_id === 'main');
        const result = [];

        for (const mainGroup of mainGroups) {
            const groupResult = {
                label: mainGroup.name,
                value: mainGroup.chat_id,
                children: [{
                    label: mainGroup.name,
                    value: 'main',
                }]
            };

            const children = groupList.filter(item =>
                item.thread_id !== 'main' && item.chat_id === mainGroup.chat_id
            ).sort((a, b) => {
                // Перевіряємо, чи існують властивості name перед порівнянням
                const nameA = (a.name || '').toString();
                const nameB = (b.name || '').toString();
                return nameA.localeCompare(nameB);
            });

            children.forEach(child => {
                groupResult.children.push({
                    label: child.name,
                    value: child.thread_id
                });
            });

            result.push(groupResult);
        }

        const galleryList = await Gallery.find({chat_id_bot: currentBot?.chat_id});

        let galleryArray = []

        galleryList.forEach(child => {
            galleryArray.push({
                label: child.file_name,
                value: child.file_id
            });
        });

        res.json({thread: result, gallery: galleryArray});
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
                        groupFind.push({_id:currentGroup?._id, chat_id: currentGroup?.chat_id, name:currentGroup?.name, working:true})
                    } else {
                        const botGroup = await BotsGroup.findOne({chat_id: currentGroup?.chat_id, working:true})

                        if(botGroup)
                            groupFind.push({_id:currentGroup?._id, chat_id: currentGroup?.chat_id, name:currentGroup?.name, working:true})
                        else
                            groupFind.push({_id:currentGroup?._id, chat_id: currentGroup?.chat_id, name:currentGroup?.name, working:false})
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


router.post("/getGroupTags",  async (req, res) => {
    try {
        const { id, group_id } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(id !== null && id){
            try{

                const botGroup = await BotsGroup.findOne({_id: id})
                const pipeline = [
                    {
                        $match:{
                            chat_id: group_id,
                            thread_id: botGroup?.thread_id,
                        }
                    },
                    {
                        $group: {
                            _id: "$hashtag",
                            count: { $sum: 1 },
                            originalId: { $first: "$_id" },
                            hashtag: { $first: "$hashtag" },
                            chat_id: { $first: "$chat_id" },
                            chat_id_bot: { $first: "$chat_id_bot" }
                        }
                    },
                    {
                        $project: {
                            _id: "$originalId",
                            hashtag: "$_id",
                            chat_id: 1,
                            chat_id_bot: 1,
                            count: 1
                        }
                    }
                ];


                const botHashTags = await BotHashTags.aggregate(pipeline);

                res.json({status: true, hashTags: botHashTags});
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

router.post("/deleteHashtag",  async (req, res) => {
    try {
        const { group_id,chat_id,hashTag,activeKey } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(chat_id !== null && chat_id && hashTag !== null && hashTag){
            try{

                if(activeKey === 'all'){
                    const botGroupCurrent = await BotsGroup.findOne({chat_id_bot: chat_id})
                    await BotHashTags.deleteMany({hashtag:hashTag,chat_id:group_id, chat_id_bot: botGroupCurrent?.chat_id_bot});

                    const botData = await BotsList.findOne({chat_id: chat_id});
                    const botGroup = await BotsGroup.find({chat_id: group_id})

                    const botGroupMain = await BotsGroup.findOne({chat_id: group_id, thread_id:'main'})

                    const pipeline = [
                        {
                            $match:{
                                chat_id: group_id
                            }
                        },
                        {
                            $group: {
                                _id: "$hashtag",
                                count: { $sum: 1 },
                                originalId: { $first: "$_id" },
                                hashtag: { $first: "$hashtag" },
                                chat_id: { $first: "$chat_id" },
                                chat_id_bot: { $first: "$chat_id_bot" }
                            }
                        },
                        {
                            $project: {
                                _id: "$originalId",
                                hashtag: "$_id",
                                chat_id: 1,
                                chat_id_bot: 1,
                                count: 1
                            }
                        }
                    ];

                    const pipelineAll = [
                        {
                            $group: {
                                _id: "$hashtag",
                                count: { $sum: 1 },
                                originalId: { $first: "$_id" },
                                hashtag: { $first: "$hashtag" },
                                chat_id: { $first: "$chat_id" },
                                chat_id_bot: { $first: "$chat_id_bot" }
                            }
                        },
                        {
                            $project: {
                                _id: "$originalId",
                                hashtag: "$_id",
                                chat_id: 1,
                                chat_id_bot: 1,
                                count: 1
                            }
                        }
                    ];

                    const botAllHashTags = await BotHashTags.aggregate(pipelineAll);

                    const botHashTags = await BotHashTags.aggregate(pipeline);

                    res.json({status: true, botData: botData, botGroup: botGroup, groupMain: botGroupMain, hashTags: botHashTags, allHashTags: botAllHashTags});
                } else {
                    const botGroupCurrent = await BotsGroup.findOne({_id: activeKey})
                    await BotHashTags.deleteMany({hashtag:hashTag,chat_id:group_id, thread_id: botGroupCurrent?.thread_id, chat_id_bot: botGroupCurrent?.chat_id_bot});

                    const botData = await BotsList.findOne({chat_id: chat_id});
                    const botGroup = await BotsGroup.find({chat_id: group_id})

                    const botGroupMain = await BotsGroup.findOne({chat_id: group_id, thread_id:'main'})

                    const pipeline = [
                        {
                            $match:{
                                thread_id: botGroupCurrent?.thread_id,
                            }
                        },
                        {
                            $group: {
                                _id: "$hashtag",
                                count: { $sum: 1 },
                                originalId: { $first: "$_id" },
                                hashtag: { $first: "$hashtag" },
                                chat_id: { $first: "$chat_id" },
                                chat_id_bot: { $first: "$chat_id_bot" }
                            }
                        },
                        {
                            $project: {
                                _id: "$originalId",
                                hashtag: "$_id",
                                chat_id: 1,
                                chat_id_bot: 1,
                                count: 1
                            }
                        }
                    ];

                    const botHashTags = await BotHashTags.aggregate(pipeline);


                    const pipelineAll = [
                        {
                            $group: {
                                _id: "$hashtag",
                                count: { $sum: 1 },
                                originalId: { $first: "$_id" },
                                hashtag: { $first: "$hashtag" },
                                chat_id: { $first: "$chat_id" },
                                chat_id_bot: { $first: "$chat_id_bot" }
                            }
                        },
                        {
                            $project: {
                                _id: "$originalId",
                                hashtag: "$_id",
                                chat_id: 1,
                                chat_id_bot: 1,
                                count: 1
                            }
                        }
                    ];

                    const botAllHashTags = await BotHashTags.aggregate(pipelineAll);

                    res.json({status: true, botData: botData, botGroup: botGroup, groupMain: botGroupMain, hashTags: botHashTags, allHashTags: botAllHashTags});
                }

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

router.post("/getHashData",  async (req, res) => {
    try {
        const { bot_id, group_id, hash_id } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(bot_id !== null && bot_id && group_id !== null && group_id){
            try{
                const botHash = await BotHashTags.findOne({_id: hash_id})
                const botData = await BotsList.findOne({_id:bot_id});
                const botGroup = await BotsGroup.find({chat_id: group_id})
                const botCurrent = await BotsList.findOne({_id:bot_id});

                const pipeline = [
                    {
                        $match: {
                            chat_id: group_id,
                            chat_id_bot: String(botCurrent?.chat_id),
                            hashtag: botHash?.hashtag,
                            thread_id: botHash?.thread_id
                        }
                    },
                    {
                        $group: {
                            _id: {
                                thread_id: "$thread_id",
                                hashtag: "$hashtag",
                                chat_id_user: "$chat_id_user"
                            },
                            count: { $sum: 1 },
                            chat_id: { $first: "$chat_id" },
                            chat_id_bot: { $first: "$chat_id_bot" },
                            chat_id_user: { $first: "$chat_id_user" },
                            username: { $first: "$username" },
                            first_name: { $first: "$first_name" },
                            createdAt: { $min: "$createdAt" },
                            updatedAt: { $max: "$updatedAt" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            thread_id: "$_id.thread_id",
                            hashtag: "$_id.hashtag",
                            count: 1,
                            chat_id: 1,
                            chat_id_bot: 1,
                            chat_id_user: 1,
                            username: 1,
                            first_name: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    },
                    {
                        $sort: { thread_id: 1, count: -1 }
                    }
                ];

                const botHashData = await BotHashTags.aggregate(pipeline)

                const botGroupMain = await BotsGroup.findOne({chat_id: group_id, thread_id:'main'})

                res.json({status: true, botData: botData, botGroup: botGroup, groupMain: botGroupMain, hashTags: botHash, hashTagData:botHashData});
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

router.post("/getGroupData",  async (req, res) => {
    try {
        const { group_id, bot_id } = req.body;
        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(bot_id !== null && bot_id && group_id !== null && group_id){
            try{
                const botData = await BotsList.findOne({_id:bot_id});
                const botGroup = await BotsGroup.find({chat_id: group_id})

                const botGroupMain = await BotsGroup.findOne({chat_id: group_id, thread_id:'main'})

                const pipeline = [
                    {
                        $match: {
                            chat_id: group_id
                        }
                    },
                    {
                        $group: {
                            _id: "$hashtag",
                            count: { $sum: 1 },
                            originalId: { $first: "$_id" },
                            hashtag: { $first: "$hashtag" },
                            chat_id: { $first: "$chat_id" },
                            chat_id_bot: { $first: "$chat_id_bot" }
                        }
                    },
                    {
                        $project: {
                            _id: "$originalId",
                            hashtag: "$_id",
                            chat_id: 1,
                            chat_id_bot: 1,
                            count: 1
                        }
                    }
                ];

                const botHashTags = await BotHashTags.aggregate(pipeline);

                res.json({status: true, botData: botData, botGroup: botGroup, groupMain: botGroupMain, hashTags: botHashTags});
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

router.post("/stopedParsedGroup",  async (req, res) => {
    try {
        const { chat_id } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(chat_id !== null && chat_id){
            try{
                const botGroupInfo = await BotsGroup.findOne({chat_id: chat_id, thread_id:'main'})

                const botGroup = await BotsGroup.updateMany({chat_id: chat_id}, {working:!botGroupInfo?.working})

                res.json({status: true});
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

router.post("/removeGroup",  async (req, res) => {
    try {
        const { chat_id } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(chat_id !== null && chat_id){
            try{
                const botGroupInfo = await BotsGroup.findOne({chat_id: chat_id, thread_id:'main'})

                const botGroup = await BotsGroup.deleteMany({chat_id: chat_id})
                const botGroupHashTags = await BotHashTags.deleteMany({chat_id: chat_id})

                res.json({status: true});
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

router.post("/disabledParse",  async (req, res) => {
    try {
        const { id, chat_id } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(id !== null && id){
            try{
                const botGroup = await BotsGroup.findOne({chat_id: chat_id, thread_id:id})
                const botGroupList = await BotsGroup.find({chat_id: chat_id})

                if(botGroup?.working){
                    await BotsGroup.updateOne({chat_id: chat_id, thread_id:id}, {working: false})
                    res.json({status: true, botGroup: botGroupList});
                } else {
                    await BotsGroup.updateOne({chat_id: chat_id, thread_id:id}, {working: true})
                    res.json({status: true, botGroup: botGroupList});
                }

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

router.post("/deleteUserHashTag",  async (req, res) => {
    try {
        const { group_id, hash_id } = req.body;

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(group_id !== null && group_id && hash_id !== null && hash_id){
            try {

                const findHashName = await BotHashTags.findOne({_id: hash_id})
                await BotHashTags.deleteMany({
                    chat_id: group_id,
                    chat_id_user: findHashName?.chat_id_user,
                    hashtag: findHashName?.hashtag
                })
                res.json({status: true});


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

                if(!botData?.status){
                    const bot = new Bot(botData?.token);
                    bot.launch();
                } else {
                    const bot = new Bot(botData?.token);
                    await bot.stopBot();
                }


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


router.post("/removeBot",  async (req, res) => {
    try {
        const { id } = req.body;
        const Bot = require('../bot/bot');

        const user_token = req.cookies.token;
        if (!user_token) return res.json(false);

        const adminlog = jwt.verify(user_token, JWT_SECRET);
        const admin = await Admin.find({_id: adminlog.id });

        if(!admin) return res.json(false);

        if(id !== null && id){
            try {
                const botData = await BotsList.findOne({_id: id});

                const bot = new Bot(botData?.token);
                await bot.stopBot();

                await BotsList.deleteOne({_id: id})
                await BotsGroup.deleteMany({chat_id_bot: botData?.chat_id})
                await BotHashTags.deleteMany({chat_id_bot: botData?.chat_id})

                res.json({status: true});
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