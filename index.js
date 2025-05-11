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


//node cron for rewads every hr
console.log("🔁 rewardUpdater cron file loaded");
 require('./utiles/cron/rewardUpdater');
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


//server listening
server.listen(PORT,async()=>{
    try {
        await dataBase_connect()
        console.log(`Server is UP at Port : ${PORT}`);
    } catch (error) {
        console.log(error.message);
    }
}).on('error', (error) => {
    console.error(`Error starting server: ${error.message}`);
});