const mongoose = require('mongoose');
require('dotenv').config();

const conectarMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB conectado');
    } catch (error) {
        console.error('Error al conectar MongoDB:', error);
        process.exit(1);
    }
};

module.exports = conectarMongo;
