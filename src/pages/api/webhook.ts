
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
