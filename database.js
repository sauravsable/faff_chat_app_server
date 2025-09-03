const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const connectDataBase = async ()=>{
    await mongoose.connect(MONGO_URI)
    .then((data)=>{console.log(`Mongodb connected with Server: ${data.connection.host}`)})
    .catch((err)=>{console.log(err)})
}

module.exports = connectDataBase;