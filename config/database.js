const mongoose = require('mongoose');

let connection = null;

const connectDB = async () => {
    try {
        if (connection) {
            return connection;
        }

        // Increase timeout and add other options for better stability
        const mongooseOptions = {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            maxPoolSize: 50,
            minPoolSize: 10
        };

        connection = await mongoose.connect(process.env.MONGO_URL, mongooseOptions);
        
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            connection = null;
        });

        return connection;
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

module.exports = { connectDB }; 