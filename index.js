const cors=require('cors')
const express=require("express")
const dataBase_connect=require('./config/db')
require('dotenv').config()
const user_routes=require('./routes/user.routes')
const admin_routes=require('./routes/admin.routes')
const logger = require('./utiles/logger')
const rateLimit = require('express-rate-limit');
const notificationRoutes=require("./routes/notification.route")
const miningRoutes=require("./routes/mining.routes")
const { connectDB } = require('./config/database');


//node cron for rewads every hr
require("./utiles/cron/dailyTask.cron");
require("./utiles/cron/weeklyMonthlypoints.cron")
require("./utiles/cron/sessioncleanupmining.cron")
require("./utiles/cron/updateminingpoints")

//telegram bot
 //require('./bots/telegramBot.js');



// rate limiter
const globalLimiter = rateLimit({
    windowMs: 1 * 1000, // 1 second window
    max: 5, // limit each IP to 5 requests per second
    message: "Too many requests. Please slow down.",
  });
  

// port
const PORT=process.env.PORT



// initilize server
const server=express()



//midlewares
server.use(express.json())
server.use(cors({
origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
server.use(logger)
server.use(globalLimiter)




//testing routes
server.use('/home',async(req,res)=>{
    try {
        res.status(200).json({
            msg:"server running fine"
        })
    } catch (error) {
        res.status(500).json({
            msg:error.message
        })
    }
})



// routes
server.use('/user',user_routes)
server.use('/admin',admin_routes)
server.use('/admin', notificationRoutes)
server.use('/user/mining', miningRoutes);



const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start the server
        server.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();