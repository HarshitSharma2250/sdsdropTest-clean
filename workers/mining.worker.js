const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { MiningService } = require('../services/mining.service');
const Mining = require('../models/mining/mining.model');
const { connectDB } = require('../config/database');
require('dotenv').config();

if (!isMainThread) {
    let isConnected = false;

    // Worker process
    async function handleWorkerTask(task) {
        try {
            // Ensure database connection
            if (!isConnected) {
                await connectDB();
                isConnected = true;
            }

            switch (task.type) {
                case 'UPDATE_POINTS':
                    await MiningService.updateAllSessions();
                    parentPort.postMessage({ 
                        success: true, 
                        message: 'Points updated successfully' 
                    });
                    break;

                case 'PROCESS_SESSION':
                    const { sessionId, currentTime } = task.data;
                    const session = await Mining.findById(sessionId);
                    if (!session) {
                        throw new Error(`Session ${sessionId} not found`);
                    }
                    await MiningService.processSession(session, new Date(currentTime));
                    parentPort.postMessage({ 
                        success: true, 
                        message: 'Session processed successfully',
                        sessionId 
                    });
                    break;

                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
        } catch (error) {
            console.error(`Worker error processing ${task.type}:`, error);
            parentPort.postMessage({ 
                success: false, 
                error: error.message,
                taskType: task.type,
                data: task.data 
            });
        }
    }

    // Listen for messages from main thread
    parentPort.on('message', handleWorkerTask);
}

// Worker pool manager
class MiningWorkerPool {
    constructor(numWorkers = 4) {
        this.workers = [];
        this.taskQueue = [];
        this.currentWorker = 0;
        this.initialize(numWorkers);
    }

    initialize(numWorkers) {
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(__filename, {
                // Pass environment variables to worker
                env: process.env
            });
            
            this.workers.push({
                worker,
                busy: false
            });

            worker.on('message', (result) => {
                console.log(`Worker ${i} completed task:`, result);
                this.workers[i].busy = false;
                this.processNextTask();
            });

            worker.on('error', (error) => {
                console.error(`Worker ${i} error:`, error);
                this.workers[i].busy = false;
                this.processNextTask();
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker ${i} stopped with exit code ${code}`);
                    // Recreate the worker
                    this.recreateWorker(i);
                }
            });
        }
    }

    recreateWorker(index) {
        const worker = new Worker(__filename, {
            env: process.env
        });
        
        this.workers[index] = {
            worker,
            busy: false
        };

        worker.on('message', (result) => {
            console.log(`Recreated Worker ${index} completed task:`, result);
            this.workers[index].busy = false;
            this.processNextTask();
        });

        worker.on('error', (error) => {
            console.error(`Recreated Worker ${index} error:`, error);
            this.workers[index].busy = false;
            this.processNextTask();
        });
    }

    async processNextTask() {
        if (this.taskQueue.length === 0) return;

        const availableWorker = this.workers.find(w => !w.busy);
        if (!availableWorker) return;

        const nextTask = this.taskQueue.shift();
        if (!nextTask) return;

        const { task, resolve, reject } = nextTask;
        
        availableWorker.busy = true;
        availableWorker.worker.postMessage(task);

        availableWorker.worker.once('message', (result) => {
            resolve(result);
        });

        availableWorker.worker.once('error', (error) => {
            reject(error);
        });
    }

    async runTask(task) {
        return new Promise((resolve, reject) => {
            const availableWorker = this.workers.find(w => !w.busy);
            
            if (!availableWorker) {
                this.taskQueue.push({ task, resolve, reject });
                return;
            }

            availableWorker.busy = true;
            availableWorker.worker.postMessage(task);

            availableWorker.worker.once('message', (result) => {
                resolve(result);
                this.processNextTask();
            });

            availableWorker.worker.once('error', (error) => {
                reject(error);
                this.processNextTask();
            });
        });
    }

    async updatePoints() {
        return this.runTask({ type: 'UPDATE_POINTS' });
    }

    async processSession(sessionId) {
        return this.runTask({
            type: 'PROCESS_SESSION',
            data: {
                sessionId,
                currentTime: new Date().toISOString()
            }
        });
    }

    shutdown() {
        this.workers.forEach(({ worker }) => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
    }
}

// Export the worker pool if in main thread
if (isMainThread) {
    module.exports = MiningWorkerPool;
} 