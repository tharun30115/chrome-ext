require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { downloadInstagramMedia } = require('./downloader');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Please set TELEGRAM_BOT_TOKEN in .env file');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const userStates = {}; // { chatId: { state, link } }

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { state: 'waiting_for_link' };
  bot.sendMessage(chatId, 'Welcome! Please send me the Instagram post or reel link.');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return; // ignore commands except /start

  const userState = userStates[chatId];
  if (!userState || userState.state !== 'waiting_for_link') {
    bot.sendMessage(chatId, 'Please send /start to begin.');
    return;
  }

  // Save link, ask for choice
  userStates[chatId] = { state: 'waiting_for_choice', link: text };

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Audio', callback_data: 'audio' },
          { text: 'Video/Post', callback_data: 'video' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, 'What do you want to download?', options);
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const choice = callbackQuery.data;

  const userState = userStates[chatId];
  if (!userState || userState.state !== 'waiting_for_choice') {
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Please send a link first by typing /start' });
    return;
  }

  const link = userState.link;

  bot.answerCallbackQuery(callbackQuery.id); // remove loading state

  bot.sendMessage(chatId, `Processing your request for ${choice}...`);

  try {
    const fileBuffer = await downloadInstagramMedia(link, choice); // returns Buffer or throws

    // Telegram limits: max 50MB for files (better check size if big)
    // Send file back: video, audio, or photo accordingly
    if (choice === 'audio') {
      bot.sendAudio(chatId, fileBuffer);
    } else if (choice === 'video') {
      // For video or photo, try video first, else photo
      // Here assume downloader returns {type, buffer}
      if (fileBuffer.type === 'video') {
        bot.sendVideo(chatId, fileBuffer.buffer);
      } else if (fileBuffer.type === 'photo') {
        bot.sendPhoto(chatId, fileBuffer.buffer);
      } else {
        bot.sendMessage(chatId, 'Sorry, unable to retrieve video or photo.');
      }
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Failed to download media. Make sure the link is a valid Instagram post or reel.');
  }

  userStates[chatId] = null; // reset
});
