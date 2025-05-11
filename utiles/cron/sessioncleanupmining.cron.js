const cron = require('node-cron');
const Mining = require('../../models/mining/mining.model');

// Run the cleanup function once every day at midnight to remove expired sessions
cron.schedule('0 0 * * *', async () => {
  console.log('Cleaning up expired mining sessions...');

  // Find and delete sessions older than 3 hours
  const expiredSessions = await Mining.find({
    endTime: { $exists: true },
    startTime: { $lt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  });

  if (expiredSessions.length > 0) {
    const expiredSessionIds = expiredSessions.map((session) => session._id);
    await Mining.deleteMany({ _id: { $in: expiredSessionIds } });
    console.log(`Deleted ${expiredSessions.length} expired sessions.`);
  }
});
