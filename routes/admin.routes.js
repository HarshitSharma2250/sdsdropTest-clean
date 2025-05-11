const express=require("express")
const { Authentication, Authorization } = require("../middleware/Authentication.middleware")
const { addCrad, addTask, deleteCard, delete_Task, GetAllDetails, runReferralDistribution, getsingleuserDetail } = require("../controllers/admin.controller")


const adminrouter=express.Router()



adminrouter.post('/card',Authentication,Authorization([process.env.ROLE]),addCrad)
adminrouter.post('/task',Authentication,Authorization([process.env.ROLE]),addTask)
adminrouter.delete('/card',Authentication,Authorization([process.env.ROLE]),deleteCard)
adminrouter.delete('/task',Authentication,Authorization([process.env.ROLE]),delete_Task)
adminrouter.get('/getusers',Authentication,Authorization([process.env.ROLE]),GetAllDetails)
adminrouter.post('/updatepointsBasedOnReferd_points',Authentication,Authorization([process.env.ROLE]),runReferralDistribution)
adminrouter.post('/getsingleuser',Authentication,Authorization([process.env.ROLE]),getsingleuserDetail)
module.exports=adminrouter