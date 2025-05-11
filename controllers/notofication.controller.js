const User = require('../models/UserRegistration.model');
const bot = require('../bots/telegramnotification/notificationbot'); 

exports.sendNotification = async (req, res) => {
  // const { title, description, image, link } = req.body;


  // if (!title || !description || !image ) {
  //   return res.status(400).json({ success: false, msg: 'All fields are required.' });
  // }

  try {
    const users = await User.find();
    const telegramIds = users.map(user => user.telegram_id);

    if (telegramIds.length === 0) {
      return res.status(400).json({ success: false, msg: 'No users found to send notification to.' });
    }

    const title = "🎁 Get ready to win $100!";
    const description = `Get ready to win $100 from a $1000 prize pool!
    Here’s your mission:
    
    1. Find the DOAAD banner on the app  
    2. Click the mission and unlock your ticket  
    3. Take a screenshot and post it on X  
    
    🎯 10 lucky winners will get $100 each.  
    
    Let the hunt begin! 🕵️‍♂️💰`;
    const gifUrl = "https://pbs.twimg.com/media/GqR1bqZbAAUY_vR?format=jpg&name=small";
    


    const message = `*${title}*\n\n${description}`;
    const inlineKeyboard = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{
            text: 'Start Mission 🕵‍♂',
            web_app: { url: "https://app.adsdrop.fun" } 
          }]
        ]
      }
    };

    const sendNotifications = telegramIds.map(telegram_id => {
      return bot.telegram.sendPhoto(telegram_id, gifUrl, {
        caption: message,
        ...inlineKeyboard
      })
      .catch(err => {
        // Log failed notifications with their telegram_id
        console.error(`Failed to send notification to ${telegram_id}:`, err.message);
      });
    });

    await Promise.all(sendNotifications);

    res.status(200).json({ success: true, msg: 'Notification sent to all users.' });

  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ success: false, msg: 'Internal server error.' });
  }
};
