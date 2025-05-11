const UserSchema=require('../models/UserRegistration.model')
const RewardSchema = require("../models/UserReward"); 
const CardSchema=require('../models/card.module')
const jwt=require("jsonwebtoken")
const cloudinary=require('../config/cloudinary')
const fs=require("fs")
const AdWatchLimit = require("../models/WatchHistory.model");
const Task=require('../models/DailyTask.model')
const TaskClaim=require('../models/UserClaimTaskTrack.model');
const ApiHit=require('../models/Hunting.model')
const RewardCycleTracker = require("../models/RewardCycleTracker")
const SocialTask =require("../models/task/socialtaskclaimed.model")
const mongoose=require('mongoose')
// const { start } = require('repl');


//user onboarding
const Register = async (req, res) => {
    const data = req.body;
    const { telegram_id,refered_by } = data;
  

    if (!telegram_id) {
      return res.status(404).json({
        success: false,
        msg: "telegram_id is required",
      });
    }
  
    try {
      let x_access_token;
      let x_refresh_token;
  
      const checkuser = await UserSchema.findOne({ telegram_id });

      // If user already exists -> Login
      if (checkuser) {
        x_access_token = jwt.sign({ _id: checkuser._id }, process.env.ACCESS_KEY, { expiresIn: "2d" });
        x_refresh_token = jwt.sign({ _id: checkuser._id }, process.env.REFRESH_KEY, { expiresIn: "12d" });
  
        res.setHeader("x_access_token", `Bearer ${x_access_token}`);
        res.setHeader("x_refresh_token", `Bearer ${x_refresh_token}`);
  
        return res.status(201).json({
          success: true,
          msg: "Login successful",
          data: {
            x_access_token,
            x_refresh_token,
            x_id: checkuser?._id,
            x_register: false,
          },
        });
      }
  

      // Find the referrer
      if (refered_by) {
        const referrer = await UserSchema.findOne({ telegram_id: refered_by });
        if (referrer) {
            await RewardSchema.findOneAndUpdate(
              { userId: referrer._id },
              {
                $inc: {
                  tsads: 1000,
                  weeklyTsadsPoints:1000,
                  monthlyTsadsPoints:1000,
                  refered_count:1,
                  refered_points:1000
                },
              },
              { upsert: true, new: true }
            );
          }
      }

      // If user doesn't exist -> Register
      const adduser = new UserSchema(data);
      await adduser.save();
  

      const newReward = new RewardSchema({
        userId:adduser._id,
        weeklyTsadsPoints:0,
        monthlyTsadsPoints:0,
        rewardType: "bonus",
        status: "active",
        tsads: 5000,
      });
      await newReward.save();

      x_access_token = jwt.sign({ _id: adduser._id }, process.env.ACCESS_KEY, { expiresIn: "2d" });
      x_refresh_token = jwt.sign({ _id: adduser._id }, process.env.REFRESH_KEY, { expiresIn: "12d" });
  
      res.setHeader("x_access_token", `Bearer ${x_access_token}`);
      res.setHeader("x_refresh_token", `Bearer ${x_refresh_token}`);
  
      return res.status(201).json({
        success: true,
        msg: "Registration successful",
        data: {
          x_access_token,
          x_refresh_token,
          x_id: adduser?._id,
          x_register: true,
        },
      });
  
    } catch (error) {
      return res.status(500).json({
        success: false,
        msg: error.message,
        err: "error in controller",
      });
    }
  };
  

const refresh_token=async(req,res)=>{
    const {refresh_token}=req.body
    try {
     
if(!refresh_token){
    res.status(404).json({
        success:false,
        msg:"refreh token not provided , Please chack again!"
    })
}

const decoded = jwt.verify(refresh_token, process.env.REFRESH_KEY);

if(!decoded){
    return res.status(401).json({
        success:false,
        msg:"Unauthorized token , please try again !"
    })
}

const checkuser=await UserSchema.findById(decoded)

if(!checkuser){
   return res.status(404).json({
        success:false,
        msg:"User not found !"
    })
}

const x_access_token=jwt.sign({_id:checkuser._id},process.env.ACCESS_KEY, {expiresIn:"2d"})
res.setHeader("x_access_token", `Bearer ${x_access_token}`);

res.status(201).json({
    success:true,
    x_access_token:x_access_token
})

    } catch (error) {
        res.status(500).json({
            success:false,
            msg:error.message
        })
    }
}


//update user avatar
const Update_user_avatar=async (req, res) => {
    try {

        const userId = req.user_detail._id;

        if (!req.file) {
            return res.status(400).json({ msg: 'Avatar image is required' });
        }

        const user = await UserSchema.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            public_id: `avatar-${userId}-${Date.now()}`,
            overwrite: true,
            resource_type: 'image'
        });


// deleteing previous avatar
     if (user.avatar) {
        const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);        
    }

    // Removing file from local after upload
    fs.unlinkSync(req.file.path);


    user.avatar = result.secure_url;
    await user.save();


    // delete rest thing coming from data base
    const updated_user = user.toObject();
    delete updated_user.__v;
delete updated_user.role;
delete updated_user.telegram_id;
delete updated_user.refered_by
delete updated_user.name

        return res.status(200).send({ msg: 'Avatar updated successfully', data: updated_user });
    } catch (error) {
        console.error('Error updating avatar:', error);
        return res.status(500).send({ msg: 'Internal server error, try again later',msg:error.message });
    }
};


//get user info
const GetUserInfo = async (req, res) => {
    try {
        const user_data = await UserSchema.aggregate([
            {
                $match: { _id: req.user_detail._id }
            },
            {
                $project: {
                    telegram_id: 0 ,
                }
            }
        ]);
 
        if (!user_data || user_data.length === 0) {
            return res.status(404).json({
                msg: "Data not found! Please try again",
            });
        }


        res.status(200).json({
            success: true,
            message: "User data retrieved successfully",
            data: user_data[0],
        })


    } catch (error) {
        res.status(500).json({
            success:false,
            msg:error.message
        })
    }
}


// update user info
const Update_User_Info=async(req,res)=>{
            
    const data=req.body

    try {
        
const user_data = await UserSchema.findOne({_id:req.user_detail._id});
if(!user_data){
    return res.status(404).json({
        msg:'User not found ! Please try again'
    })
};

    await UserSchema.findByIdAndUpdate( 
        user_data._id ,
        { $set: data }, 
        { new: true },
    )

    res.status(201).json({
        success:true,
        message: "user updated successfully",
      });
    } catch (error) {
        res.status(500).json({
            success:false,
            message: error.message,
          });
    }
}


// add reward data
const UserReward = async (req, res) => {
    const { telegram_id ,card_name} = req.body;
    const userIdFromToken = req.user_detail._id;
try {

    const user = await UserSchema.findById(userIdFromToken);
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });

    if (user.telegram_id !== telegram_id) {
        return res.status(403).json({ success: false, msg: "Access denied: Telegram ID mismatch" });
      }
      
    if (!card_name) {
        return res.status(400).json({ success: false, msg: "Card is required" });
      }

         // Card validation
    const cardDetails = await CardSchema.findOne({ card_name: card_name });
    if (!cardDetails) {
      return res.status(404).json({ success: false, msg: "Card not found" });
    }

  // Count for this user and card 
  const count = await AdWatchLimit.countDocuments({ userId: user._id, card: cardDetails._id });
  
    if (count >= 1) {
      return res.status(403).json({ success: false, msg: "Only 1 ads per hour allowed for this card" });
    }
    await new AdWatchLimit({ userId: user._id, card: cardDetails._id }).save();
  

// wqrite logic for counting number of add of user in 1hr and give reward 
    let rewardPoints = 0;
    if (count === 0) rewardPoints = 500;
    // else if (count === 1) rewardPoints = 1000;
    // else if (count === 2) rewardPoints = 2000;


// if not get reward history then set by default
    let reward = await RewardSchema.findOne({ userId: user._id });
    if (!reward) reward = new RewardSchema({ userId: user._id, rewardType: "bonus" ,weeklyTsadsPoints: 0,monthlyTsadsPoints:0, tsads: 0, watched_ads: 0  });
  
//increase the reward points as per reward in 1hr 
    reward.monthlyTsadsPoints += rewardPoints;
    reward.weeklyTsadsPoints += rewardPoints;
    reward.tsads += rewardPoints;
    reward.watched_ads += 1;
  
    await reward.save();
  
   res.status(200).json({ 
  success: true, 
  msg: "Ad watched successfully", 
});

} catch (error) {
    res.status(500).json({
        success:false,
        msg:error.message
    })
}
  };


// get user reward data
const getUserRewardData = async (req, res) => {
    
    try {
        const user = await UserSchema.findById(req.user_detail._id);
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        const reward = await RewardSchema.findOne({ userId: user._id });

        if (!reward) {
            return res.status(200).json({ success: true, msg: "No reward data yet", data: {} });
        }

        return res.status(200).json({
            success: true,
            data: reward
        });

    } catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
};


// get spesific card card details
const getCardDetails=async(req,res)=>{
    const cardId = req.params;
    const userId = req.user_detail._id;

    try {
        const card = await CardSchema.findById(cardId.id);
        if (!card) return res.status(404).json({ success: false, msg: "Card not found" });
    
// count add watch at this card
        const count = await AdWatchLimit.countDocuments({ userId,card: card._id  });
    
      // if not get reward history then set by default
    let reward = await RewardSchema.findOne({ userId: userId});
    if (!reward) reward = new RewardSchema({ userId: userId, rewardType: "bonus" ,monthlyTsadsPoints: 0,weeklyTsadsPoints:0, tsads: 0, watched_ads: 0  });
    
        //  Based on count, figure out reward points logic
        let rewardPoints = 0;
        if (count === 1) rewardPoints = 500;
        // else if (count === 2) rewardPoints = 1000;
        // else if (count === 3) rewardPoints = 2000;
    
        res.status(200).json({
          success: true,
          cardId,
          cardName: card.name,
          adsWatched: count,
          adsLeft: Math.max(1 - count, 0),
          currentRewardForThisCard: count > 1 ? 0 : rewardPoints,
          totalRewardPoints: reward ? reward.tsads : 0,
          totalAdsWatched: reward ? reward.watched_ads : 0
        });
    
      } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
      }



}
  

// get all card details
const getAllCardDetails = async (req, res) => {
    const userId = req.user_detail._id;
  
    try {
      // get all cards
      const cards = await CardSchema.find();
  
   
      let reward = await RewardSchema.findOne({ userId });
      if (!reward) reward = new RewardSchema({ userId, rewardType: "bonus", weeklyTsadsPoints: 0,monthlyTsadsPoints:0, tsads: 0, watched_ads: 0 });
  
      const cardData = await Promise.all(cards.map(async (card) => {
        const count = await AdWatchLimit.countDocuments({ userId, card: card._id });
  
        let rewardPoints = 0;
        if (count === 1) rewardPoints = 500;
        // else if (count === 2) rewardPoints = 1000;
        // else if (count === 3) rewardPoints = 2000;
  
        return {
          cardId: card._id,
          cardName: card.card_name,
          adsWatched: count,
          adsLeft: Math.max(1 - count, 0),
          currentRewardForThisCard: count > 1 ? 0 : rewardPoints,
        };
      }));
  
      res.status(200).json({
        success: true,
        cards: cardData
      });
  
    } catch (err) {
      res.status(500).json({ success: false, msg: err.message });
    }
  };
  
  
const AllUsers = async (req, res) => {
  const { weekly, monthly } = req.query;

  let sortField = "$userlist.tsads";
  let projectField = { tsads: { $ifNull: ["$userlist.tsads", 0] } };
  let sortKey = "tsads";

  if (weekly === "true") {
    sortField = "$userlist.weeklyTsadsPoints";
    projectField = { weeklyTsads: { $ifNull: ["$userlist.weeklyTsadsPoints", 0] } };
    sortKey = "weeklyTsads";
  } else if (monthly === "true") {
    sortField = "$userlist.monthlyTsads";
    projectField = { monthlyTsads: { $ifNull: ["$userlist.monthlyTsadsPoints", 0] } };
    sortKey = "monthlyTsads";
  }

  try {
    const getUser = [
      {
        $lookup: {
          from: "rewards",
          localField: "_id",
          foreignField: "userId",
          as: "userlist"
        }
      },
      { $unwind: "$userlist" },
      {
        $facet: {
          users: [
            {
              $project: {
                name: 1,
                ...projectField
              }
            },
            {
              $sort: {
                [sortKey]: -1,
                "userlist.createdAt": 1
              }
            }
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totaltsads: { $sum: { $ifNull: ["$userlist.tsads", 0] } },
                totalWeeklyTsads: { $sum: { $ifNull: ["$userlist.weeklyTsadsPoints", 0] } },
                totalMonthlyTsads: { $sum: { $ifNull: ["$userlist.monthlyTsadsPoints", 0] } },
                totalAddsWatch: { $sum: { $ifNull: ["$userlist.watched_ads", 0] } }
              }
            }
          ]
        }
      }
    ];

    const UserData = await UserSchema.aggregate(getUser);

    res.status(200).json({
      success: true,
      users: UserData[0].users,
      totals: UserData[0].totals[0] || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
};


// task claimed daily
const claimTask = async (req, res) => {
  try {
    const userId = req.user_detail._id; 
    const { taskId } = req.body;

    const task = await Task.findOne({_id:taskId,type:"daily"});

    if (!task) {
      return res.status(404).json({ success: false, msg: "Daily task not found" });
    }

    let existingClaim = await TaskClaim.findOne({ user_id: userId, task_id: taskId });

    if (existingClaim) {
      if (existingClaim.claimed) {
        return res.status(400).json({ success: false, msg: "Task already claimed" });
      } else {
        existingClaim.claimed = true;
        existingClaim.claimed_at = new Date();
        await existingClaim.save();
      }
    } else {
      existingClaim = new TaskClaim({
        user_id: userId,
        task_id: taskId,
        claimed: true,
        claimed_at: new Date()
      });
      await existingClaim.save();
    }

    const userReward = await RewardSchema.findOne({ userId: userId });

      userReward.tsads += task.task_points;
      userReward.weeklyTsadsPoints += task.task_points;
      userReward.monthlyTsadsPoints += task.task_points;
      userReward.completed_tasks += 1;
      await userReward.save();

     res.status(200).json({ success: true, msg: "Task claimed successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};


//taks claimed social
const claimSocialTask = async (req, res) => {
  try {
    const userId = req.user_detail._id;
    const { taskId } = req.body;

    const task = await Task.findOne({ _id: taskId, type: "social" });
    if (!task) {
      return res.status(404).json({success:false, msg: "Social task not found" });
    }

    const existingClaim = await SocialTask.findOne({ user: userId, task: taskId });

    if (existingClaim && existingClaim.claimed) {
      return res.status(400).json({success:false, msg: "Task already claimed" });
    }

    const storedata = new SocialTask({
      user: userId,
      task: taskId,
      claimed: true,
      claimedAt: new Date()
    });

    await storedata.save();

    const reward = await RewardSchema.findOne({ userId: userId });

    if (reward) {
      reward.tsads += task.task_points;
      reward.weeklyTsadsPoints += task.task_points;
      reward.monthlyTsadsPoints += task.task_points;
      reward.completed_tasks += 1;
      await reward.save();
    }
    
     res.status(200).json({ success: true, msg: "Task claimed successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({success:false, msg: "Server error", error: err.message });
  }
};


// get all task
const getTask =async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user_detail._id);

    const tasks = await Task.aggregate([
      {
        $match: {
          type: { $in: ["daily", "social"] }
        }
      },
      {
        $lookup: {
          from: "taskclaims",
          let: { taskId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$task_id", "$$taskId"] },
                    { $eq: ["$user_id", userId] }
                  ]
                }
              }
            },
            {
              $project: { claimed: 1 }
            }
          ],
          as: "dailyClaimStatus"
        }
      },
      {
        $lookup: {
          from: "usertaskclaims",
          let: { taskId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$task", "$$taskId"] },
                    { $eq: ["$user", userId] }
                  ]
                }
              }
            },
            {
              $project: { claimed: 1 }
            }
          ],
          as: "socialClaimStatus"
        }
      },
      {
        $addFields: {
          claimed: {
            $cond: {
              if: { $eq: [{ $size: "$dailyClaimStatus" }, 1] },
              then: { $arrayElemAt: ["$dailyClaimStatus.claimed", 0] },
              else: {
                $cond: {
                  if: { $eq: [{ $size: "$socialClaimStatus" }, 1] },
                  then: { $arrayElemAt: ["$socialClaimStatus.claimed", 0] },
                  else: false
                }
              }
            }
          }
        }
      },
      {
        $project: {
          dailyClaimStatus: 0,
          socialClaimStatus: 0
        }
      }
    ]);

    res.status(200).json({ success: true, tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};


//get button boost gpt
const Hunting = async (req, res) => {
  const userId = req.user_detail._id;
  const { multiPoints, telegramStar } = req.body;

  try {
    if (![1, 5, 10, 15].includes(multiPoints)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid multiPoints value. Please choose from [1, 5, 10, 15].",
      });
    }

    let reward = await RewardSchema.findOne({ userId });

    if (!reward) {
      reward = new RewardSchema({
        userId,
        tsads: 0,
        monthlyTsadsPoints:0,
        weeklyTsadsPoints:0,
        rewardType: "cashback",
      });
    }

    const lastApiHit = await ApiHit.findOne({ user_id: userId }).sort({ createdAt: -1 });

    const threeHours = 3 * 60 * 60 * 1000;

    if (lastApiHit && lastApiHit.createdAt) {
      const timeSinceLastHit = Date.now() - new Date(lastApiHit.createdAt).getTime();
      if (timeSinceLastHit < threeHours) {
        return res.status(400).json({
          success: false,
          msg: "You already hit the API in the last 3 hours. Please wait before hitting again.",
        });
      }
    }

    const apiHit = await ApiHit.create({
      user_id: userId,
      multiPoints,
      telegramStar,
    });

    const tracker = new RewardCycleTracker({
      apiHitId: apiHit._id,
      active: true,
    });
    await tracker.save();

    const oneHour = 60 * 60 * 1000;
    const startTime = Date.now() + oneHour;

    // Delay full reward cycle by 1 hour
    setTimeout(() => {
      let rewardCount = 0;

      const pointInterval = setInterval(async () => {
        const elapsedTime = Date.now() - startTime;

        if (rewardCount < 3) {
          reward.tsads += multiPoints * 1000;
          reward.monthlyTsadsPoints += multiPoints * 1000;
          reward.weeklyTsadsPoints += multiPoints * 1000;
          await reward.save();
          rewardCount++;
        }

        if (rewardCount >= 3 || elapsedTime >= threeHours) {
          clearInterval(pointInterval);
          tracker.active = false;
          await tracker.save();
        }
      }, oneHour); // Every hour
    }, oneHour); // Initial 1 hour delay

    return res.status(200).json({
      success: true,
      msg: `Reward farming started. First reward will be given after 1 hour.`,
      total: reward.tsads,
    });

  } catch (err) {
    console.error("Error in hunting:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message,
    });
  }
};










module.exports={Register,refresh_token,Update_user_avatar,GetUserInfo,Update_User_Info,UserReward,getUserRewardData,getAllCardDetails,getCardDetails,AllUsers,claimTask,getTask,Hunting,claimSocialTask}




// boost logic 

// 1- button 

// tsAds-1000/hr
// time- 6hr

//auto boost
// 2- autboost

// data - multiple-1x- 1000
// multiple-5x- 5000
// multiple-10x-10000
// multiple 15x-15000


// 3- telegram_star


