const mongoose = require("mongoose");
const app = require("./server.js");
const updateBots = require("./app");

require("dotenv").config();

const { MONGO_URL, PORT } = process.env
const listen_port = PORT || 6000;

mongoose.connect(MONGO_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB is connected successfully')
    app.listen(listen_port, () => console.log(`Server running on PORT : ${listen_port}`))
}).catch(err => console.error(err))

