
import type { NextApiRequest, NextApiResponse } from 'next';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TOKEN!);

bot.command('start', (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [{
        text: '🌐 Открыть приложение',
        web_app: { url: process.env.WEBAPP_URL! }
      }],
      [{
        text: '📊 Статистика',
        callback_data: 'stats'
      }]
    ]
  };

  return ctx.reply('🔥 Добро пожаловать!', { reply_markup: keyboard });
});

bot.action('stats', (ctx) => {
  ctx.answerCbQuery();
  return ctx.reply('📈 Статистика: 75%');
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TOKEN!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Обработка webhook от Telegram
    const update = req.body;
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text === '/start') {
        const webAppUrl = process.env.WEBAPP_URL || 'https://your-app.replit.dev';
        
        await bot.telegram.sendMessage(chatId, 
          'Добро пожаловать! Нажмите кнопку ниже, чтобы пройти тест на выгорание:', 
          {
            reply_markup: {
              inline_keyboard: [[
                { 
                  text: '🔥 Пройти тест на выгорание', 
                  web_app: { url: webAppUrl }
                }
              ]]
            }
          }
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
