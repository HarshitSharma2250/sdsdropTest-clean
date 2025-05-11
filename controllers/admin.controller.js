const CardSchema=require("../models/card.module")
const UserSchema=require('../models/UserRegistration.model')
const Task=require('../models/DailyTask.model')
const Reward=require('../models/UserReward')
const mongoose=require('mongoose')


const addCrad=async(req,res)=>{
    const data=req.body
    try {

        const checkuser=await UserSchema.findById(req.user_detail._id)


if(!checkuser){
return res.status(404).json({
    success:false,
    msg:"user Not Found , Please try again leter!"
})
}

const savecard=new CardSchema(data)
await savecard.save()


res.status(201).json({
    success:true,
    msg:"card generate successfully"
})


    } catch (error) {
        res.status(500).json({
success:false,
msg:error.message
        })
    }
}


const addTask=async(req,res)=>{
    const { task_name, type, task_points,task_url, valid_till } = req.body;
    try {
        
const userId=req.user_detail._id

const userName=await UserSchema.findById(userId)

if(!userName){
    return res.status(404).json({ success: false, message: "User Not Found." });
}

        if (!task_name || !type || !task_points) {
            return res.status(400).json({ success: false, msg: "All fields are required." });
          }

          const taskData = new Task({
            task_name,
            type,
            task_points,
            created_by:userName.name
          });

   // Conditionally add valid_till if it exists
   if (valid_till) {
    taskData.valid_till = valid_till;
  }

  if (task_url) {
    taskData.task_url = task_url;
  }

  const newTask = new Task(taskData);
          await newTask.save()

          res.status(201).json({ success: true, msg: "Task created Successfully"});

    } catch (error) {
        res.status(500).json({ success: false, msg: error.message });
    }
}

const deleteCard=async(req,res)=>{

const cardId=req.body;


    try {
        const userId=req.user_detail._id

const checkuser=await UserSchema.findById(userId)

if(!checkuser){
    return res.status(404).json({
        success:false,
        msg:"user not found ! try again leter"
    })
}

const deleteData=await CardSchema.findByIdAndDelete(cardId)

if(!deleteData){
    return res.status(404).json({
        success:false,
        msg:"this card not exist , please add valid card data!"
    })
}

res.status(204).json({
    success:true,
    msg:"card deleted successfully"
})

    } catch (error) {
        res.status(500).json({
            success:false,
            msg:error.message
        })
    }
}


const delete_Task=async(req,res)=>{

    const {task_id}=req.body

    try {
        const check_task=await Task.findById({_id:task_id})

if(!check_task){
    return res.status(404).json({
        success:false,
        msg:"task not found"
    })
}

const deleteTask=await Task.findByIdAndDelete({_id:task_id})

res.status(200).json({
    success:true,
    msg:"task deleted successfully"
})

    } catch (error) {
        res.status(500).json({
            success:false,
            msg:error.message
        })
    }
}

const GetAllDetails=async(req,res)=>{
    const user_id=req.user_detail
    try {
        const checkuserId=await UserSchema.findById(user_id)
        if(!checkuserId){
            return res.status(404).json({
                success:false,
                msg:"user not found"
            })
        }

if(checkuserId?.role!=="Admin"){
    return res.status(403).json({
        success:false,
        msg:"You are not Authorized for this Action!"
    })
}


const getuserdata=[
    {
      $lookup: {
        from: "rewards",             
        localField: "_id",          
        foreignField: "userId",     
        as: "rewards"               
      }
    },
    {
        $unwind:"$rewards"
    }
  ];

  const data=await UserSchema.aggregate(getuserdata)
res.status(200).json({
    success:true,
    data:data
})
    } catch (error) {
        return res.status(500).json({
            success:false,
            msg:error.message
        })
    }
}


const runReferralDistribution = async (req, res) => {
    try {
      const { name, telegram_id , enter_code } = req.body;
  const user_id=req.user_detail
 


if(enter_code!==process.env.ADDCODE){
return res.status(403).json({
    success:false,
    msg:"incorrect Action!, After Hitting 3 times , you will blocked permanently"
})
}

      // Step 1: Validate the caller
      const adminUser = await UserSchema.findOne({
        name: process.env.NAME,
        telegram_id: process.env.TELEGRAM_ID,
        role: "Admin"
      });
  

      if (!adminUser || adminUser.name !== name || adminUser.telegram_id !== telegram_id) {
        return res.status(403).json({ success:true,msg: "Unauthorized: You are not allowed to perform this action." });
      }
  
     const checkAuthenticate=await UserSchema.findById(user_id)
     if(!checkAuthenticate){
        return res.status(404).json({
            success:true,
            msg:"user not found"
        })
     }

      // Step 2: Aggregation to join rewards and get refered_points
      const usersWithRewards = await UserSchema.aggregate([
        {
          $lookup: {
            from: "rewards",
            localField: "_id",
            foreignField: "userId",
            as: "rewardsInfo"
          }
        },
        { $unwind: "$rewardsInfo" },
        {
          $project: {
            _id: 1,
            rewards_id: "$rewardsInfo._id",
            refered_points: "$rewardsInfo.refered_points"
          }
        },
        {
          $match: {
            refered_points: { $gt: 0 }
          }
        }
      ]);

      // Step 3: Increment tsads in rewards by refered_points
      const bulkOps = usersWithRewards.map(user => ({
        updateOne: {
          filter: { _id: user.rewards_id },
          update: { $inc: { tsads: user.refered_points } }
        }
      }));
  
      if (bulkOps.length > 0) {
        await Reward.bulkWrite(bulkOps);
      }
  
      return res.status(200).json({ success:true,msg: "Referral points distributed successfully" });
  
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ success:true,msg: "Server error", error });
    }
  };
  


const getsingleuserDetail=async(req,res)=>{
    const {userId}=req.body
    const admin_id=req.user_detail
    try {
        
const checkadmin=await UserSchema.findById(admin_id)

if(!checkadmin){
    return res.status(404).json({
        success:false,
        msg:"user not found"
    })
}
if(checkadmin?.role!=="Admin"){
    return res.status(403).json({
        success:false,
        msg:"You are not Authorized for this Action!"
    })
}

const data=[
    {
$match: { _id: new mongoose.Types.ObjectId(userId) }
    },
    {
        $lookup:{
            from:"rewards",
            localField:"_id",
            foreignField:"userId",
            as:"reward"
        }
    },
        {
            $unwind:"$reward"
        },    
]

const userdata=await UserSchema.aggregate(data)

res.status(200).json({
    success:true,
    userdata:userdata
})

    } catch (error) {
        res.status(500).json({
            success:true,
            msg:error.message
        })
    }
  }


module.exports={addCrad,addTask,deleteCard,delete_Task,GetAllDetails,runReferralDistribution,getsingleuserDetail}


