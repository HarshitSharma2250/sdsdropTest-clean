const MiningService = require('../services/mining.service');
const MiningWorker = require('../workers/mining.worker');

const worker = new MiningWorker();


// Start mining session
const startMining = async (req, res) => {
    try {
        const userId = req.user_detail._id;
        const session = await MiningService.startSession(userId);
        
        // Start worker to update points
        worker.updatePoints(session._id);
        
        res.status(200).json({ 
            success: true,
            message: 'Mining session started!', 
            sessionId: session._id 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Boost mining session
const boostMining = async (req, res) => {
    try {
        const userId = req.user_detail._id;
        const session = await MiningService.boostSession(userId);
        
        res.status(200).json({ 
            success: true,
            message: 'Boost activated!', 
            sessionId: session._id 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    worker.shutdown();
});

module.exports = {
    startMining,
    boostMining
};