const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
dotenv.config();

// Create a new Telegraf bot instance
const notificationBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Export the bot instance
module.exports = notificationBot;
