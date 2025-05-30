console.log("[Bot] TOKEN:", process.env.TOKEN ? "***" + process.env.TOKEN.slice(-5) : "MISSING");
console.log("[Bot] WEBAPPURL:", process.env.WEBAPPURL || "MISSING");
console.log("[Bot] WEBHOOKSECRETTOKEN:", process.env.WEBHOOKSECRETTOKEN ? "***" + process.env.WEBHOOKSECRETTOKEN.slice(-5) : "MISSING");

import { Telegraf, Markup } from 'telegraf';
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// Проверка наличия обязательных переменных окружения
const requiredEnvVars = ['TOKEN', 'WEBAPPURL', 'WEBHOOKSECRETTOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars.join(', '));
  process.exit(1);
}

const bot = new Telegraf(process.env.TOKEN!);
const webAppUrl = process.env.WEBAPPURL!;

// 1. Глобальный обработчик ошибок бота
bot.catch((err, ctx) => {
  console.error(`[Bot Error] Update ${ctx.update.update_id}:`, err);
  try {
    ctx.reply('❌ Произошла внутренняя ошибка');
  } catch (e) {
    console.error('Failed to send error message:', e);
  }
});

// 2. Улучшенное логирование входящих обновлений
bot.use((ctx, next) => {
  const updateType = Object.keys(ctx.update)
    .find(key => key !== 'update_id') || 'unknown';
    
  console.log(`[Update ${ctx.update.update_id}] Type: ${updateType} | From: ${ctx.from?.id} | Chat: ${ctx.chat?.id}`);
  
  return next();
});

// Обработка команды /start
bot.command('start', async (ctx) => {
  try {
    // 3. Фикс для корректного отображения кнопки веб-приложения
    const keyboard = Markup.inlineKeyboard([
      Markup.button.webApp(
        '🌐 Открыть приложение', 
        `${webAppUrl}` 
      ),
      Markup.button.callback('📊 Статистика', 'stats')
    ]);
    
    // 4. Фикс экранирования для MarkdownV2
    await ctx.reply('🔥 Добро пожаловать!', {
      reply_markup: keyboard.reply_markup,
      parse_mode: 'MarkdownV2'
    });
  } catch (err) {
    console.error('Error in /start command:', err);
    await ctx.reply('❌ Произошла ошибка, попробуйте позже.');
  }
});

// Обработка callback для кнопки статистики
bot.action('stats', async (ctx) => {
  try {
    await ctx.reply('📊 Здесь будет статистика!');
    // 5. Обязательно отвечаем на callback
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Error in stats callback:', err);
    await ctx.answerCbQuery('❌ Ошибка при загрузке статистики');
  }
});

// Обработчик вебхука
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 6. Проверка секретного токена
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  
  // Безопасное сравнение токенов
  const safeCompare = (a: string, b: string) => {
    try {
      const aBuf = Buffer.from(a);
      const bBuf = Buffer.from(b);
      return crypto.timingSafeEqual(aBuf, bBuf);
    } catch (e) {
      return false;
    }
  };

  if (
    !secretToken || 
    typeof secretToken !== 'string' ||
    !safeCompare(secretToken, process.env.WEBHOOKSECRETTOKEN!)
  ) {
    console.error('Invalid secret token:', {
      received: secretToken || 'MISSING',
      expected: process.env.WEBHOOKSECRETTOKEN ? 
        '***' + process.env.WEBHOOKSECRETTOKEN.slice(-5) : 'MISSING'
    });
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 7. Проверка наличия тела запроса
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Empty request body');
    return res.status(400).json({ error: 'Empty body' });
  }

  try {
    console.log(`Processing update ${req.body.update_id}`);
    
    // 8. Обработка обновления
    await bot.handleUpdate(req.body);
    
    return res.status(200).json({ ok: true });
    
  } catch (err) {
    // 9. Подробное логирование ошибки
    console.error('Webhook processing error:', {
      error: err instanceof Error ? {
        message: err.message,
        stack: err.stack
      } : err,
      body: req.body
    });
    
    // 10. Всегда возвращаем 200 OK для Telegram
    return res.status(200).json({ 
      error: 'Webhook processing failed but acknowledged'
    });
  }
}

// 11. Фикс для работы на Vercel
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Keeping alive for Vercel.');
});
