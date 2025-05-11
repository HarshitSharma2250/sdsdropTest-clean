const TelegramBot = require('node-telegram-bot-api');
require("dotenv").config();



const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// bot.on('message', (msg) => {
//   console.log('📩 New message received:', msg); 
// })


bot.on('message', (msg) => {
  const chatId = msg.chat.id;


  if (msg.text === '/start') {
    const welcomeMessage = `
Hey, *${msg.from.first_name || 'friend'}*! Welcome to *AdsDrop*! ✨

Watch ads, complete simple tasks, and start earning real money! 💸  
Every ad you watch brings you closer to bigger rewards and exciting payouts. Stay active, stay rewarded!

By using this bot, you confirm you've read and agreed to our *Privacy Policy*.

Let's begin your earning journey today! 🚀
`;

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '▶️ Start Earning',
              web_app: { url: 'https://app.adsdrop.fun' }
            }
          ],
          [
            {
              text: '💬 Join Community',
              url: 'https://t.me/adsdropfun'
            }
          ],
          [
            {
              text: 'Join Twitter',
              url: 'https://x.com/AdsDrop_?s=09'
            }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, welcomeMessage, options).catch(console.error);
  }
});

// Log any errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});


