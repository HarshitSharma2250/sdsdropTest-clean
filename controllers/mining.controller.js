const Mining = require('../models/mining/mining.model');
const Boost = require('../models/mining/boost.model');
const Reward = require('../models/UserReward');

const NORMAL_RATE = 8.33; // Points per minute for normal mining
const BOOSTED_RATE = 41.65; // Points per minute for boosted mining

// const NORMAL_RATE = 8.33; // Points per minute for normal mining
// const BOOSTED_RATE = 83.33; // Points per minute for boosted mining


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


// cron controller Update points every 10 minutes
const updatePoints = async () => {
  const currentTime = new Date();

  // Get active mining sessions
  const activeSessions = await Mining.find({ endTime: { $exists: false } });

  for (const session of activeSessions) {
    const lastUpdated = session.lastUpdated || session.startTime;
    const minutesSinceLastUpdate = Math.floor((currentTime - lastUpdated) / (1000 * 60)); // Time difference in minutes

    // Only process if at least 10 minutes have passed since the last update
    if (minutesSinceLastUpdate >= 10) {
      const intervals = Math.floor(minutesSinceLastUpdate / 10); // Number of 10-minute intervals that have passed
      const rate = session.isBoosted ? BOOSTED_RATE : NORMAL_RATE; // Points rate based on boost status
      const pointsToAdd = Math.floor(rate * 10) * intervals; // Points to add for each interval

      // Update session points incrementally
      session.points += pointsToAdd;

      // Update the 'lastUpdated' timestamp to reflect the last update time
      session.lastUpdated = new Date(lastUpdated.getTime() + intervals * 10 * 60 * 1000); // Add intervals * 10 minutes to last updated

      // Save updated session
      await session.save();

      // Add points to the user's reward schema
      const reward = await Reward.findOne({ userId: session.userId });
      if (reward) {
        reward.tsads += pointsToAdd;
        await reward.save();
      }
    }
  }
};

module.exports={updatePoints,startMining,boostMining}