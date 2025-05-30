console.log("[Bot] TOKEN:", process.env.TOKEN ? "***" + process.env.TOKEN.slice(-5) : "MISSING");
console.log("[Bot] WEBAPPURL:", process.env.WEBAPPURL || "MISSING");

import { Telegraf, Markup } from 'telegraf'; // Импортируем Markup
import type { NextApiRequest, NextApiResponse } from 'next';

// Проверка наличия переменных окружения
if (!process.env.TOKEN || !process.env.WEBAPPURL) {
  console.error('Missing environment variables: TOKEN or WEBAPPURL');
  process.exit(1);
}

const bot = new Telegraf(process.env.TOKEN);

// Логирование входящих обновлений для отладки
bot.use((ctx, next) => {
  console.log('Received update:', ctx.update);
  return next();
});

// Обработка команды /start - ИСПРАВЛЕНО
bot.command('start', async (ctx) => {
  try {
    // Создаем клавиатуру с использованием Markup
    const keyboard = Markup.inlineKeyboard([
      Markup.button.webApp('🌐 Открыть приложение', process.env.WEBAPPURL),
      Markup.button.callback('📊 Статистика', 'stats')
    ]);
    
    await ctx.reply('🔥 Добро пожаловать!', {
      reply_markup: keyboard.reply_markup, // snake_case
      parse_mode: 'MarkdownV2'             // snake_case
    });
  } catch (err) {
    console.error('Error in /start command:', err);
    await ctx.reply('Произошла ошибка, попробуйте позже.');
  }
});

// Обработка callback для кнопки статистики
bot.action('stats', async (ctx) => {
  try {
    await ctx.reply('📊 Здесь будет статистика!');
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Error in stats callback:', err);
    await ctx.answerCbQuery('Ошибка при загрузке статистики');
  }
});

// Обработчик вебхука
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', { error: err, body: req.body });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
