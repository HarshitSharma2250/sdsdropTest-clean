const { Worker, isMainThread, parentPort } = require('worker_threads');
const Mining = require('../models/mining/mining.model');
const MiningService = require('../services/mining.service');
const { connectDB } = require('../config/database');

if (!isMainThread) {
    let isConnected = false;
    console.log('Worker thread started');

    async function updateAllSessions() {
        console.log('Running update at:', new Date().toISOString());
        try {
            if (!isConnected) {
                console.log('Connecting to database...');
                await connectDB();
                isConnected = true;
                console.log('Connected to database');
            }

            const activeSessions = await Mining.find({ 
                endTime: { $exists: false }
            });
            console.log('Found active sessions:', activeSessions.length);

            for (const session of activeSessions) {
                console.log('Updating session:', session._id);
                await MiningService.updatePoints(session);
                console.log('Updated session:', session._id);
            }
        } catch (error) {
            console.error('Error in updateAllSessions:', error);
        }
    }

    // Run every 1 minute
    console.log('Setting up 1-minute interval');
    setInterval(updateAllSessions, 60 * 1000);
    
    // Initial update
    console.log('Running initial update');
    updateAllSessions();
}

class MiningWorker {
    constructor() {
        console.log('Creating MiningWorker instance');
        this.worker = new Worker(__filename);
        
        this.worker.on('error', (error) => {
            console.error('Worker error:', error);
        });

        this.worker.on('exit', (code) => {
            console.log(`Worker exited with code ${code}`);
        });
    }

    shutdown() {
        console.log('Shutting down worker');
        this.worker.terminate();
    }
}

if (isMainThread) {
    module.exports = MiningWorker;
} 