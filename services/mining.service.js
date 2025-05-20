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

    // Create date with local timezone
    const now = new Date();
    const startTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    console.log('Creating new mining session:');
    console.log('- Local time:', startTime.toLocaleString());
    console.log('- Expected end time:', new Date(startTime.getTime() + MINING_CONFIG.MAX_DURATION).toLocaleString());
    console.log('- Timezone offset:', now.getTimezoneOffset());

    const newSession = new Mining({
      userId,
      startTime: startTime,
      points: 0,
      isBoosted: false,
      lastUpdated: startTime
    });

    await newSession.save();
    console.log('Session created with ID:', newSession._id);
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

    // Create boost time with local timezone
    const now = new Date();
    const boostTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    console.log('Boosting mining session:');
    console.log('- Local boost time:', boostTime.toLocaleString());
    console.log('- Timezone offset:', now.getTimezoneOffset());
    console.log('- ISO string:', boostTime.toISOString());

    // Update mining session
    miningSession.isBoosted = true;
    miningSession.boostStartTime = boostTime;
    await miningSession.save();

    // Create boost record
    const newBoost = new Boost({
      userId,
      isBoosted: true,
      boostTime: boostTime
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
    const minutesSinceLastUpdate = Math.floor((currentTime - lastUpdated) / (1000 * 60));

    // Log session status
    console.log(`Processing session for user ${session.userId}:`);
    console.log(`- Session duration: ${Math.floor(sessionDuration / (1000 * 60))} minutes`);
    console.log(`- Time since last update: ${minutesSinceLastUpdate} minutes`);
    console.log(`- Current points: ${session.points.toFixed(2)}`);
    console.log(`- Is boosted: ${session.isBoosted}`);
    console.log(`- Session start: ${sessionStart.toLocaleString()}`);
    console.log(`- Current time: ${currentTime.toLocaleString()}`);
    console.log(`- Expected end: ${new Date(sessionStart.getTime() + MINING_CONFIG.MAX_DURATION).toLocaleString()}`);

    // Only end session if it's truly past the max duration
    if (sessionDuration >= MINING_CONFIG.MAX_DURATION) {
      console.log(`Session for user ${session.userId} reached max duration of 3 hours`);
      await this.finalizeSession(session);
      return;
    }

    // Regular update if enough time has passed
    if (minutesSinceLastUpdate >= MINING_CONFIG.UPDATE_INTERVAL) {
      await this.updateSessionPoints(session, minutesSinceLastUpdate);
    }
  }

  static async finalizeSession(session) {
    const sessionEndTime = new Date(session.startTime.getTime() + MINING_CONFIG.MAX_DURATION);
    const lastUpdated = session.lastUpdated || session.startTime;
    const minutesSinceLastUpdate = Math.floor((sessionEndTime - lastUpdated) / (1000 * 60));

    console.log(`Finalizing session for user ${session.userId}:`);
    console.log(`- Total session duration: ${Math.floor((sessionEndTime - session.startTime) / (1000 * 60))} minutes`);
    console.log(`- Minutes since last update: ${minutesSinceLastUpdate}`);
    console.log(`- Current points before final update: ${session.points.toFixed(2)}`);
    console.log(`- Session start: ${session.startTime.toLocaleString()}`);
    console.log(`- Session end: ${sessionEndTime.toLocaleString()}`);

    if (minutesSinceLastUpdate > 0) {
      const pointsToAdd = this.calculatePoints(session, minutesSinceLastUpdate);
      session.points += pointsToAdd;
      await this.updateRewards(session.userId, pointsToAdd);
      
      console.log(`Final update: +${pointsToAdd.toFixed(2)} points (${minutesSinceLastUpdate} minutes)`);
    }

    session.endTime = sessionEndTime;
    session.lastUpdated = sessionEndTime;
    await session.save();

    console.log(`Session finalized with total points: ${session.points.toFixed(2)}`);
    console.log(`Expected total points for 3 hours: ${(8.33 + (179 * 41.66)).toFixed(2)}`);
  }

  static async updateSessionPoints(session, minutesSinceLastUpdate) {
    const pointsToAdd = this.calculatePoints(session, minutesSinceLastUpdate);
    
    session.points += pointsToAdd;
    session.lastUpdated = new Date(session.lastUpdated.getTime() + 
      MINING_CONFIG.UPDATE_INTERVAL * 60 * 1000);
    await session.save();

    await this.updateRewards(session.userId, pointsToAdd);
    
    console.log(`Updated session for user ${session.userId}:`);
    console.log(`- Added ${pointsToAdd.toFixed(2)} points`);
    console.log(`- Processed ${minutesSinceLastUpdate} minutes`);
    console.log(`- New total: ${session.points.toFixed(2)} points`);
    console.log(`- Expected total after 3 hours: ${(8.33 + (179 * 41.66)).toFixed(2)} points`);
  }

  static calculatePoints(session, minutes) {
    const sessionStart = new Date(session.startTime);
    const boostStart = session.boostStartTime ? new Date(session.boostStartTime) : null;
    
    let totalPoints = 0;
    let normalMinutes = 0;
    let boostedMinutes = 0;
    
    // Calculate points for each minute
    for (let i = 0; i < minutes; i++) {
      const currentMinute = new Date(sessionStart.getTime() + i * 60 * 1000);
      
      // Only use boosted rate if session is boosted AND we're past boost start time
      if (session.isBoosted && boostStart && currentMinute >= boostStart) {
        totalPoints += MINING_CONFIG.BOOSTED_RATE;
        boostedMinutes++;
      } else {
        totalPoints += MINING_CONFIG.NORMAL_RATE;
        normalMinutes++;
      }
    }
    
    console.log(`Point calculation for ${minutes} minutes:`);
    console.log(`- Session is boosted: ${session.isBoosted}`);
    console.log(`- Boost start time: ${boostStart ? boostStart.toLocaleString() : 'Not boosted'}`);
    console.log(`- Normal rate minutes: ${normalMinutes} (${(normalMinutes * MINING_CONFIG.NORMAL_RATE).toFixed(2)} points)`);
    console.log(`- Boosted rate minutes: ${boostedMinutes} (${(boostedMinutes * MINING_CONFIG.BOOSTED_RATE).toFixed(2)} points)`);
    console.log(`- Total points for this update: ${totalPoints.toFixed(2)}`);
    
    return totalPoints;
  }

  static async updateAllSessions() {
    try {
      const currentTime = new Date();
      const activeSessions = await Mining.find({ 
        endTime: { $exists: false },
        startTime: { 
          $gte: new Date(currentTime.getTime() - MINING_CONFIG.MAX_DURATION - MINING_CONFIG.BUFFER_TIME)
        }
      });

      console.log(`Found ${activeSessions.length} active sessions to update`);
      console.log(`Current time: ${currentTime.toLocaleString()}`);

      for (const session of activeSessions) {
        await this.processSession(session, currentTime);
      }
    } catch (error) {
      console.error('Error updating mining points:', error);
      throw error;
    }
  }

  static async recalculateSessionPoints(sessionId) {
    const session = await Mining.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const sessionStart = new Date(session.startTime);
    const boostStart = session.boostStartTime ? new Date(session.boostStartTime) : null;
    const sessionEnd = session.endTime || new Date(sessionStart.getTime() + MINING_CONFIG.MAX_DURATION);
    
    const totalMinutes = Math.floor((sessionEnd - sessionStart) / (1000 * 60));
    const boostStartMinutes = boostStart ? Math.floor((boostStart - sessionStart) / (1000 * 60)) : 0;
    
    let totalPoints = 0;
    let normalMinutes = 0;
    let boostedMinutes = 0;
    
    // Calculate points for each minute
    for (let i = 0; i < totalMinutes; i++) {
      const currentMinute = new Date(sessionStart.getTime() + i * 60 * 1000);
      
      // Only use boosted rate if session is boosted AND we're past boost start time
      if (session.isBoosted && boostStart && currentMinute >= boostStart) {
        totalPoints += MINING_CONFIG.BOOSTED_RATE;
        boostedMinutes++;
      } else {
        totalPoints += MINING_CONFIG.NORMAL_RATE;
        normalMinutes++;
      }
    }
    
    console.log(`Recalculating points for session ${sessionId}:`);
    console.log(`- Session is boosted: ${session.isBoosted}`);
    console.log(`- Boost start time: ${boostStart ? boostStart.toLocaleString() : 'Not boosted'}`);
    console.log(`- Total minutes: ${totalMinutes}`);
    console.log(`- Normal rate minutes: ${normalMinutes} (${(normalMinutes * MINING_CONFIG.NORMAL_RATE).toFixed(2)} points)`);
    console.log(`- Boosted rate minutes: ${boostedMinutes} (${(boostedMinutes * MINING_CONFIG.BOOSTED_RATE).toFixed(2)} points)`);
    console.log(`- Total points: ${totalPoints.toFixed(2)}`);
    
    // Update session points
    session.points = totalPoints;
    session.lastUpdated = sessionEnd;
    await session.save();
    
    // Update rewards
    await this.updateRewards(session.userId, totalPoints - session.points);
    
    return session;
  }
}

module.exports = {
  MiningService,
  MINING_CONFIG
}; 