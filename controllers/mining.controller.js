const Mining = require('../models/mining/mining.model');
const Boost = require('../models/mining/boost.model');
const Reward = require('../models/UserReward');

const NORMAL_RATE = 8.33;
const BOOSTED_RATE = 41.66; 
const MAX_MINING_DURATION = 3 * 60 * 60 * 1000; 

// Start mining session
const startMining = async (req, res) => {
  const userId = req.user_detail._id;

  console.log(userId,"check what getting")
  // Check if user already has an active mining session
  const existingSession = await Mining.findOne({ userId, endTime: { $exists: false } });
  if (existingSession) {
    return res.status(400).json({ message: 'You already have an active mining session.' });
  }

  // Create new mining session
  const newSession = new Mining({
    userId,
    startTime: new Date(),
    points: 0,
    isBoosted: false,
  });

  await newSession.save();
  res.status(200).json({ message: 'Mining session started!', sessionId: newSession._id });
};


// Boost mining session
const boostMining = async (req, res) => {
  const userId = req.user_detail._id;

  // Check if user has an active session
  const miningSession = await Mining.findOne({ userId, endTime: { $exists: false } });
  if (!miningSession) {
    return res.status(400).json({ message: 'You don\'t have an active mining session.' });
  }

  // Check if boost is already applied
  const boost = await Boost.findOne({ userId });
  if (boost && boost.isBoosted) {
    return res.status(400).json({ message: 'You have already activated boost.' });
  }

  // Mark the session as boosted
  miningSession.isBoosted = true;
  miningSession.boostStartTime = new Date();
  await miningSession.save();

  // Create a boost record
  const newBoost = new Boost({
    userId,
    isBoosted: true,
    boostTime: new Date(),
  });

  await newBoost.save();
  res.status(200).json({ message: 'Boost activated!', sessionId: miningSession._id });
};


const updatePoints = async () => {
  try {
    const currentTime = new Date();

    // Find active mining sessions (not yet ended)
    const activeSessions = await Mining.find({ endTime: { $exists: false } });

    for (const session of activeSessions) {
      const sessionStart = new Date(session.startTime);
      const sessionDuration = currentTime - sessionStart;

      // If 3 hours have passed, stop the session
      if (sessionDuration >= MAX_MINING_DURATION + 1 * 60 * 1000) {
        const sessionEndTime = new Date(sessionStart.getTime() + MAX_MINING_DURATION);
        const lastUpdated = session.lastUpdated || session.startTime;
        const minutesSinceLastUpdate = Math.floor((sessionEndTime - lastUpdated) / (1000 * 60));

        if (minutesSinceLastUpdate >= 10) {
          const intervals = Math.floor(minutesSinceLastUpdate / 10);
          const rate = session.isBoosted ? BOOSTED_RATE : NORMAL_RATE;
          const pointsToAdd = rate * 10 * intervals;

          session.points += pointsToAdd;

          // Update reward
          const reward = await Reward.findOne({ userId: session.userId });
          if (reward) {
            reward.tsads += pointsToAdd;
            await reward.save();
          }

          console.log(`Final update for user ${session.userId}: +${pointsToAdd} points before session end`);
        }

        session.endTime = sessionEndTime;
        session.lastUpdated = sessionEndTime;
        await session.save();

        console.log(`Stopped mining session for user ${session.userId} after 3 hours.`);
      } else {
        // If session is still within 3 hours
        const lastUpdated = session.lastUpdated || session.startTime;
        const minutesSinceLastUpdate = Math.floor((currentTime - lastUpdated) / (1000 * 60));

        if (minutesSinceLastUpdate >= 10) {
          const intervals = Math.floor(minutesSinceLastUpdate / 10);
          const rate = session.isBoosted ? BOOSTED_RATE : NORMAL_RATE;
          const pointsToAdd = rate * 10 * intervals;

          session.points += pointsToAdd;
          session.lastUpdated = new Date(lastUpdated.getTime() + intervals * 10 * 60 * 1000);
          await session.save();

          // Update reward
          const reward = await Reward.findOne({ userId: session.userId });
          if (reward) {
            reward.tsads += pointsToAdd;
            reward.weeklyTsadsPoints+=pointsToAdd;
            reward.monthlyTsadsPoints+=pointsToAdd;

            await reward.save();
          }

          console.log(`Updated session for user ${session.userId}: +${pointsToAdd} points (${intervals} intervals)`);
        } else {
          console.log(`Skipped session ${session._id} (last updated ${minutesSinceLastUpdate} mins ago)`);
        }
      }
    }

  } catch (error) {
    console.error('Error updating mining points:', error);
  }
};




// cron controller Update points every 10 minutes
// const updatePoints = async () => {
//   const activeSessions = await Mining.find({ endTime: { $exists: false } });

//   activeSessions.forEach(async (session) => {
//     const currentTime = new Date();
//     const elapsedTime = (currentTime - session.startTime) / (1000 * 60); // Time in minutes
//     const pointsToAdd = session.isBoosted ? BOOSTED_RATE : NORMAL_RATE;

//     // Calculate points based on elapsed time and mining rate
//     const points = pointsToAdd*10;

//     // Update session points
//     session.points = points;
//     await session.save();

//     // Add points to the user's reward schema
//     const reward = await Reward.findOne({ userId: session.userId });
//     if (reward) {
//       reward.tsads += points;
//       await reward.save();
//     }
//   });
// };











module.exports={updatePoints,startMining,boostMining}