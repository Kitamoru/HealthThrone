require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TOKEN);

// Start command handler
bot.command('start', (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [{
        text: '🌐 Открыть приложение',
        web_app: { url: process.env.WEBAPP_URL }
      }],
      [{
        text: '📊 Статистика',
        callback_data: 'stats'
      }]
    ]
  };

  return ctx.reply('🔥 Добро пожаловать!', { reply_markup: keyboard });
});

// Stats callback handler
bot.action('stats', (ctx) => {
  ctx.answerCbQuery();
  return ctx.reply('📈 Статистика: 75%');
});

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err);
});

const startBot = () => {
  bot.launch();
  console.log('Telegram bot started');
};

module.exports = { startBot };