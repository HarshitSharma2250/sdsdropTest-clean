const{Router}=require("express")
const { Register, refresh_token, Update_user_avatar, GetUserInfo, Update_User_Info,UserReward, getUserRewardData, getCardDetails, getAllCardDetails, AllUsers, claimTask, getTask, claimSocialTask } = require("../controllers/user.controllers")
const { Authentication } = require("../middleware/Authentication.middleware")
const { upload, processImage } = require("../middleware/avatar.middleware")
const rateLimit = require('express-rate-limit');
const user_routes=Router()



const updateAvatarLimiter = rateLimit({
    windowMs: 10 * 24 * 60 * 60 * 1000,          // 10 days window
    max: 1,                     // Only 1 request allowed per window per IP
    message: "You can update your avatar only once every 10 days.",
    statusCode: 429,
});

const updateProfileLimiter = rateLimit({
    windowMs: 10 * 24 * 60 * 60 * 1000,          // 10 days window
    max: 1,                     // Only 1 request allowed per window per IP
    message: "You can update your profile only once every 10 days.",
    statusCode: 429,
});

user_routes.post('/register',Register)
user_routes.post('/token',refresh_token)
// user_routes.patch('/avatar',Authentication,updateAvatarLimiter,upload.single('avatar'), processImage,Update_user_avatar)
user_routes.patch('/avatar',Authentication,upload.single('avatar'), processImage,Update_user_avatar)
user_routes.get('/profile',Authentication,GetUserInfo)
user_routes.patch('/profile',Authentication,updateProfileLimiter,Update_User_Info)
user_routes.post('/watch-add',Authentication,UserReward)
user_routes.get('/get-reward-data',Authentication,getUserRewardData)
user_routes.get(`/card/:id`,Authentication,getCardDetails)
user_routes.get(`/card`,Authentication,getAllCardDetails)
user_routes.get('/users',Authentication,AllUsers)
user_routes.post('/claim-task',Authentication,claimTask)
user_routes.get('/task',Authentication,getTask)
user_routes.post('/socialtask-claimed',Authentication,claimSocialTask)


module.exports=user_routes

