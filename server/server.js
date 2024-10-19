const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
// const botRoute = require('./routes/bot.route');
const bodyParser = require('body-parser');
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const qrFolder = path.join(__dirname, 'uploads', 'qr');
const imagesFolder = path.join(__dirname, 'uploads', 'image');
const sendingFolderOutput = path.join(__dirname, 'uploads/sending');
const videoFolder = path.join(__dirname, 'uploads', 'video');
const sendingFolder = path.join(__dirname, 'uploads/sending');
const supportFolder = path.join(__dirname, 'uploads/support/downloads');

app.use('/qr', express.static(qrFolder));
app.use('/images', express.static(imagesFolder));
app.use('/sending-images', express.static(sendingFolderOutput, {
    index: false, // Відключає індексацію файлів у директорії
    dotfiles: 'deny', // Блокує доступ до прихованих файлів
    maxAge: '3d' // Налаштування кешування
}));
app.use('/video', express.static(videoFolder));
app.use('/sending', express.static(sendingFolder));
app.use('/supports', express.static(supportFolder));

//middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());

app.use(cors({
    origin: true,
    credentials: true,
}));

const sendingStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/sending/');
    },
    filename: function (req, file, cb) {
        const originalFileName = file.originalname;
        const ext = path.extname(originalFileName);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const newFileName = uniqueSuffix + ext;

        req.oldFileName = originalFileName;
        req.newFileName = newFileName;

        cb(null, newFileName);
    },
});

const seminarsStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/image/');
    },
    filename: function (req, file, cb) {
        const originalFileName = file.originalname;
        const ext = path.extname(originalFileName);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const newFileName = uniqueSuffix + ext;

        req.oldFileName = originalFileName;
        req.newFileName = newFileName;

        cb(null, newFileName);
    },
});


const uploadSending = multer({ storage: sendingStorage });
const uploadSeminarPhoto = multer({ storage: seminarsStorage });

app.post('/uploadSending', uploadSending.single('file'), (req, res) => {
    res.json({ oldFileName: req.oldFileName, newFileName: req.newFileName });
});

app.post('/uploadSeminarPhoto', uploadSeminarPhoto.single('file'), (req, res) => {
    res.json({ oldFileName: req.oldFileName, newFileName: req.newFileName });
});

app.post('/deleteUploadSending', async (req, res) => {
    try {
        if (!req.body || !req.body.filename) {
            return res.status(400).send('Old file name not provided');
        }

        const { filename } = req.body;
        const filePath = path.join(__dirname, 'uploads/sending', filename);

        try {
            await fs.unlinkSync(filePath);
            res.send('File deleted');
        } catch (error) {
            res.status(500).send('Error deleting file');
        }
    } catch (e) {
        console.error(e);
    }
});

app.post('/deleteUploadSeminarImage', async (req, res) => {
    try {
        // console.log(req.body.filename)
        if (!req.body || !req.body.filename) {
            return res.status(400).send('Old file name not provided');
        }

        const { filename } = req.body;
        const filePath = path.join(__dirname, 'uploads/image', filename);

        try {
            await fs.unlinkSync(filePath);
            res.send('File deleted');
        } catch (error) {
            res.status(500).send('Error deleting file');
        }
    } catch (e) {
        console.error(e);
    }
});

app.use("/api/v1/admin", require("./AdminService/admin.router.js"));
app.use("/api/v1/upload", require("./AdminService/upload.router.js"));
app.use("*", (req, res) => res.status(404).json({ error: "not found"}));

module.exports = app;