require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { downloadInstagramVideo } = require('./downloader');
const { extractAudio } = require('./ffmpeg');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const userStates = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Send an Instagram post/reel URL to begin.');
  userStates.set(msg.chat.id, { step: 'awaiting_url' });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('/')) return;

  const state = userStates.get(chatId);

  if (!state || state.step === 'awaiting_url') {
    if (!text.includes('instagram.com')) {
      bot.sendMessage(chatId, 'Please send a valid Instagram URL.');
      return;
    }

    userStates.set(chatId, { step: 'awaiting_choice', url: text });

    bot.sendMessage(chatId, 'Choose format to download:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎵 Audio', callback_data: 'audio' },
            { text: '🎥 Video', callback_data: 'video' },
          ]
        ]
      }
    });
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const choice = query.data;
  const state = userStates.get(chatId);

  if (!state || state.step !== 'awaiting_choice') {
    bot.answerCallbackQuery(query.id, { text: 'Please send a valid Instagram URL first.' });
    return;
  }

  bot.answerCallbackQuery(query.id);
  bot.sendMessage(chatId, `Downloading ${choice}...`);

  try {
    const videoBuffer = await downloadInstagramVideo(state.url);

    if (choice === 'video') {
      await bot.sendVideo(chatId, videoBuffer, {}, {
        filename: 'video.mp4',
        contentType: 'video/mp4'
      });
    } else if (choice === 'audio') {
      const audioBuffer = await extractAudio(videoBuffer);
      await bot.sendAudio(chatId, audioBuffer, {}, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });
    }

    userStates.delete(chatId);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Failed to process the link. Make sure it’s a public post.');
  }
});
