const cron = require('node-cron');
const User = require('../../models/UserReward');

// Reset weekly points every Monday at 00:00
cron.schedule('0 0 * * 1', async () => {
  await User.updateMany({}, { $set: { weeklyTsadsPoints: 0 } });
  console.log('Weekly tsads points reset.');
});

// Reset monthly points on 1st day of month at 00:00
cron.schedule('0 0 1 * *', async () => {
  await User.updateMany({}, { $set: { monthlyTsadsPoints: 0 } });
  console.log('Monthly tsads points reset.');
});

