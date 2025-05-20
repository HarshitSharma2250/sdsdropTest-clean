const cron = require('node-cron');
const Mining = require('../../models/mining/mining.model');

// Function to handle session cleanup
const cleanupExpiredSessions = async () => {
  console.log('[Mining Cleanup] Starting cleanup of expired sessions...');
  const startTime = Date.now();

  try {
    // Find expired sessions
  const expiredSessions = await Mining.find({
    endTime: { $exists: true, $lt: new Date() }
  });

  if (expiredSessions.length > 0) {
      const expiredSessionIds = expiredSessions.map(session => session._id);
      
      // Delete expired sessions
      const result = await Mining.deleteMany({ 
        _id: { $in: expiredSessionIds } 
      });

      const duration = Date.now() - startTime;
      console.log(`[Mining Cleanup] Deleted ${result.deletedCount} expired sessions in ${duration}ms`);
  } else {
      console.log('[Mining Cleanup] No expired sessions found');
  }
  } catch (error) {
    console.error('[Mining Cleanup] Error during cleanup:', error);
  }
};

// Run the cleanup function every hour
// The pattern '0 * * * *' means: "at minute 0 of every hour"
cron.schedule('0 * * * *', cleanupExpiredSessions, {
  scheduled: true,
  timezone: 'UTC'
});
