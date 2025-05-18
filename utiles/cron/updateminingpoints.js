const cron = require('node-cron');
const MiningWorkerPool = require('../../workers/mining.worker');

// Create a worker pool with 4 workers
const workerPool = new MiningWorkerPool(4);

// Function to handle cron execution with worker pool
const executeCronTask = async () => {
  console.log('[Mining Points Update] Starting points update with worker pool...');
  const startTime = Date.now();
  
  try {
    const result = await workerPool.updatePoints();
    const duration = Date.now() - startTime;
    console.log(`[Mining Points Update] Completed successfully in ${duration}ms`, result);
  } catch (error) {
    console.error('[Mining Points Update] Error during execution:', error);
  }
};

// Run the updatePoints function every 10 minutes
// The pattern '*/10 * * * *' means: "every 10th minute"
cron.schedule('*/10 * * * *', executeCronTask, {
  scheduled: true,
  timezone: 'UTC'
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Shutting down mining worker pool...');
  workerPool.shutdown();
  process.exit(0);
});
