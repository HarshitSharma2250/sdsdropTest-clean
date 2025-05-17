

const cron = require('node-cron');
const Mining = require('../../models/mining/mining.model');

// Run the cleanup function every hour
cron.schedule('0 * * * *', async () => {
  console.log('Cleaning up expired mining sessions...');

  // Delete sessions where endTime has already passed
  const expiredSessions = await Mining.find({
    endTime: { $exists: true, $lt: new Date() }
  });

  if (expiredSessions.length > 0) {
    const expiredSessionIds = expiredSessions.map((session) => session._id);
    await Mining.deleteMany({ _id: { $in: expiredSessionIds } });
    console.log(`Deleted ${expiredSessions.length} expired sessions.`);
  } else {
    console.log('No expired sessions found.');
  }
});
