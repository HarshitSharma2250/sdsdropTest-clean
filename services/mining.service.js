const Mining = require('../models/mining/mining.model');
const Reward = require('../models/UserReward');

const MINING_CONFIG = {
  NORMAL_RATE: 8.33,  // 500 points/hour
  BOOSTED_RATE: 41.66, // 2500 points/hour
  MAX_DURATION: 3 * 60 * 60 * 1000, // 3 hours
  UPDATE_INTERVAL: 10 * 60 * 1000 // 10 minutes
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
      isBoosted: false,
      lastUpdated: new Date()
    });

    await newSession.save();
    return newSession;
  }

  static async boostSession(userId) {
    const session = await Mining.findOne({ 
      userId, 
      endTime: { $exists: false } 
    });

    if (!session) {
      throw new Error('No active mining session found');
    }

    session.isBoosted = true;
    session.boostStartTime = new Date();
    await session.save();
    return session;
  }

  static async updatePoints(session) {
    const now = new Date();
    const lastUpdated = session.lastUpdated;
    const minutesSinceLastUpdate = Math.floor((now - lastUpdated) / (1000 * 60));
    
    if (minutesSinceLastUpdate < 10) return;

    const pointsToAdd = this.calculatePoints(session, minutesSinceLastUpdate);
    session.points += pointsToAdd;
    session.lastUpdated = now;

    // Check if session should end
    if (now - session.startTime >= MINING_CONFIG.MAX_DURATION) {
      session.endTime = now;
    }

    await session.save();
    await this.updateRewards(session.userId, pointsToAdd);
    return session;
  }

  static calculatePoints(session, minutes) {
    const boostStart = session.boostStartTime ? new Date(session.boostStartTime) : null;
    const sessionStart = new Date(session.startTime);
    let totalPoints = 0;

    for (let i = 0; i < minutes; i++) {
      const currentMinute = new Date(sessionStart.getTime() + i * 60 * 1000);
      if (session.isBoosted && boostStart && currentMinute >= boostStart) {
        totalPoints += MINING_CONFIG.BOOSTED_RATE;
      } else {
        totalPoints += MINING_CONFIG.NORMAL_RATE;
      }
    }
    
    return totalPoints;
  }

  static async updateRewards(userId, pointsToAdd) {
    const reward = await Reward.findOne({ userId });
    if (!reward) return;
    reward.tsads += pointsToAdd;
    await reward.save();
  }
}

module.exports = MiningService; 