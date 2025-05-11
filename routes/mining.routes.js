const express = require('express');
const router = express.Router();
const { Authentication } = require('../middleware/Authentication.middleware');
const { startMining, boostMining } = require('../controllers/mining.controller');

// Start a normal mining session
router.post('/start',Authentication , startMining);

// Boost mining session
router.post('/boost',Authentication, boostMining);

module.exports = router;
