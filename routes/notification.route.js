const express = require('express');
const { sendNotification } = require('../controllers/notofication.controller');
const { Authentication, Authorization } = require('../middleware/Authentication.middleware');
const router = express.Router();

router.post('/notify',Authentication, sendNotification);

module.exports = router;
