const Mining = require('../models/mining/mining.model');
const Boost = require('../models/mining/boost.model');
const Reward = require('../models/UserReward');

// Constants
const MINING_CONFIG = {
  NORMAL_RATE: 8.33,  // 500 points/hour
  BOOSTED_RATE: 41.66, // 2500 points/hour
  MAX_DURATION: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
  UPDATE_INTERVAL: 10, // minutes
  BUFFER_TIME: 60 * 1000 // 1 minute buffer for final update
};

class MiningService {
  static async startSession(userId) {
    const existingSession = await Mining.findOne({ 
      userId, 
      endTime: { $exists: false } 
    });

    if (existingSession) {
      throw new Error('Active mining session already exists');
    }

    const newSession = new Mining({
      userId,
      startTime: new Date(),
      points: 0,
      isBoosted: false
    });

    await newSession.save();
    return newSession;
  }

  static async boostSession(userId) {
    const miningSession = await Mining.findOne({ 
      userId, 
      endTime: { $exists: false } 
    });

    if (!miningSession) {
      throw new Error('No active mining session found');
    }

    const boost = await Boost.findOne({ userId });
    if (boost?.isBoosted) {
      throw new Error('Boost already activated');
    }

    // Update mining session
    miningSession.isBoosted = true;
    miningSession.boostStartTime = new Date();
    await miningSession.save();

    // Create boost record
    const newBoost = new Boost({
      userId,
      isBoosted: true,
      boostTime: new Date()
    });
    await newBoost.save();

    return miningSession;
  }

  static async updateRewards(userId, pointsToAdd) {
    const reward = await Reward.findOne({ userId });
    if (!reward) return;

    reward.tsads += pointsToAdd;
    reward.weeklyTsadsPoints += pointsToAdd;
    reward.monthlyTsadsPoints += pointsToAdd;
    await reward.save();

    return reward;
  }

  static async processSession(session, currentTime) {
    const sessionStart = new Date(session.startTime);
    const sessionDuration = currentTime - sessionStart;
    const lastUpdated = session.lastUpdated || session.startTime;

    // Check if session should end
    if (sessionDuration >= MINING_CONFIG.MAX_DURATION + MINING_CONFIG.BUFFER_TIME) {
      await this.finalizeSession(session);
      return;
    }

    // Regular update
    const minutesSinceLastUpdate = Math.floor((currentTime - lastUpdated) / (1000 * 60));
    if (minutesSinceLastUpdate >= MINING_CONFIG.UPDATE_INTERVAL) {
      await this.updateSessionPoints(session, minutesSinceLastUpdate);
    }
  }

  static async finalizeSession(session) {
    const sessionEndTime = new Date(session.startTime.getTime() + MINING_CONFIG.MAX_DURATION);
    const lastUpdated = session.lastUpdated || session.startTime;
    const minutesSinceLastUpdate = Math.floor((sessionEndTime - lastUpdated) / (1000 * 60));

    if (minutesSinceLastUpdate >= MINING_CONFIG.UPDATE_INTERVAL) {
      const pointsToAdd = this.calculatePoints(session, minutesSinceLastUpdate);
      session.points += pointsToAdd;
      await this.updateRewards(session.userId, pointsToAdd);
    }

    session.endTime = sessionEndTime;
    session.lastUpdated = sessionEndTime;
    await session.save();

    console.log(`Finalized mining session for user ${session.userId}`);
  }

  static async updateSessionPoints(session, minutesSinceLastUpdate) {
    const pointsToAdd = this.calculatePoints(session, minutesSinceLastUpdate);
    
    session.points += pointsToAdd;
    session.lastUpdated = new Date(session.lastUpdated.getTime() + 
      MINING_CONFIG.UPDATE_INTERVAL * 60 * 1000);
    await session.save();

    await this.updateRewards(session.userId, pointsToAdd);
    
    console.log(`Updated session for user ${session.userId}: +${pointsToAdd.toFixed(2)} points`);
  }

  static calculatePoints(session, minutes) {
    const rate = session.isBoosted ? MINING_CONFIG.BOOSTED_RATE : MINING_CONFIG.NORMAL_RATE;
    return rate * Math.min(minutes, MINING_CONFIG.UPDATE_INTERVAL);
  }

  static async updateAllSessions() {
    try {
      const currentTime = new Date();
      const activeSessions = await Mining.find({ endTime: { $exists: false } });

      for (const session of activeSessions) {
        await this.processSession(session, currentTime);
      }
    } catch (error) {
      console.error('Error updating mining points:', error);
      throw error;
    }
  }
}

module.exports = {
  MiningService,
  MINING_CONFIG
}; 