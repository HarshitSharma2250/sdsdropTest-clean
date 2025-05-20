const { MiningService } = require('../services/mining.service');
const MiningWorkerPool = require('../workers/mining.worker');

// Constants for points per minute to achieve 500 points per hour
const NORMAL_RATE = 8.33;
const BOOSTED_RATE = 41.66; 
const MAX_MINING_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const UPDATE_INTERVAL = 10; 

// Initialize worker pool with 4 workers
const workerPool = new MiningWorkerPool(4);

// Start mining session
const startMining = async (req, res) => {
  try {
  const userId = req.user_detail._id;
    const session = await MiningService.startSession(userId);
    
    // Start processing session in worker
    await workerPool.processSession(session._id);
    
    res.status(200).json({ 
      success: true,
      message: 'Mining session started!', 
      sessionId: session._id 
    });
  } catch (error) {
    if (error.message === 'Active mining session already exists') {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    console.error('Error starting mining session:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Boost mining session
const boostMining = async (req, res) => {
  try {
  const userId = req.user_detail._id;
    const session = await MiningService.boostSession(userId);
    
    // Update session processing in worker
    await workerPool.processSession(session._id);
    
    res.status(200).json({ 
      success: true,
      message: 'Boost activated!', 
      sessionId: session._id 
    });
  } catch (error) {
    if (error.message === 'No active mining session found' || 
        error.message === 'Boost already activated') {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
  }
    console.error('Error boosting mining session:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Update points (called by cron)
const updatePoints = async () => {
  try {
    await workerPool.updatePoints();
  } catch (error) {
    console.error('Error in updatePoints cron job:', error);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down mining worker pool...');
  workerPool.shutdown();
});

module.exports = {
  startMining,
  boostMining,
  updatePoints
};