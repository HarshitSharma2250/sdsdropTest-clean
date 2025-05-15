const cron = require('node-cron');
const { updatePoints } = require('../../controllers/mining.controller');

// Run the updatePoints function every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('Running points update every 10 minutes...');
  await updatePoints();
});
