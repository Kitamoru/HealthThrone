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
  const errorMessage = `Missing environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

const bot = new Telegraf(process.env.TOKEN!);
const webAppUrl = process.env.WEBAPPURL!;

// Улучшенный глобальный обработчик ошибок
bot.catch((err, ctx) => {
  const errorDetails = {
    updateId: ctx.update.update_id,
    updateType: Object.keys(ctx.update).find(key => key !== 'update_id') || 'unknown',
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    error: {
      message: err.message,
      stack: err.stack,
      raw: err
    }
  };
  
  console.error(`[BOT GLOBAL ERROR]`, errorDetails);
  
  try {
    if (ctx.updateType === 'callback_query') {
      ctx.answerCbQuery('❌ Internal error').catch(e => 
        console.error('Failed to answer callback:', e));
    } else {
      ctx.reply('❌ Произошла внутренняя ошибка. Мы уже работаем над её устранением.');
    }
  } catch (sendError) {
    console.error('Failed to send error notification:', sendError);
  }
});

// Логирование входящих обновлений
bot.use((ctx, next) => {
  const updateType = Object.keys(ctx.update).find(key => key !== 'update_id') || 'unknown';
  const logInfo = {
    updateId: ctx.update.update_id,
    type: updateType,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    text: 'text' in ctx.update ? ctx.update.text : undefined
  };
  
  console.log('[INCOMING UPDATE]', logInfo);
  return next();
});

// Обработка команды /start с улучшенной обработкой ошибок
bot.command('start', async (ctx) => {
  try {
    console.log(`Handling /start for user: ${ctx.from.id}`);
    
    const keyboard = Markup.inlineKeyboard([
      Markup.button.webApp(
        '🌐 Открыть приложение', 
        webAppUrl
      ),
      Markup.button.callback('📊 Статистика', 'stats')
    ]);
    
    await ctx.reply('🔥 Добро пожаловать!', {
      reply_markup: keyboard.reply_markup,
      parse_mode: 'MarkdownV2'
    });
    
    console.log(`Successfully handled /start for user: ${ctx.from.id}`);
  } catch (err) {
    console.error('[START COMMAND ERROR]', {
      userId: ctx.from?.id,
      error: err instanceof Error ? {
        message: err.message,
        stack: err.stack
      } : err
    });
    
    try {
      await ctx.reply('❌ Не удалось обработать команду. Попробуйте ещё раз.');
      await ctx.answerCbQuery();
    } catch (sendError) {
      console.error('Failed to send error notification:', sendError);
    }
    
    // Пробрасываем ошибку для глобального обработчика
    throw err;
  }
});

// Обработка callback для кнопки статистики
bot.action('stats', async (ctx) => {
  try {
    console.log(`Handling stats for user: ${ctx.from.id}`);
    await ctx.reply('📊 Здесь будет статистика!');
    await ctx.answerCbQuery();
    console.log(`Successfully handled stats for user: ${ctx.from.id}`);
  } catch (err) {
    console.error('[STATS ACTION ERROR]', {
      userId: ctx.from?.id,
      error: err instanceof Error ? {
        message: err.message,
        stack: err.stack
      } : err
    });
    
    try {
      await ctx.answerCbQuery('❌ Ошибка при загрузке статистики');
    } catch (answerError) {
      console.error('Failed to answer callback:', answerError);
    }
    
    // Пробрасываем ошибку для глобального обработчика
    throw err;
  }
});

// Обработчик вебхука
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    console.warn(`Rejected non-POST request: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка секретного токена
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
    console.error('INVALID SECRET TOKEN', {
      received: secretToken || 'MISSING',
      expected: process.env.WEBHOOKSECRETTOKEN ? 
        '***' + process.env.WEBHOOKSECRETTOKEN.slice(-5) : 'MISSING',
      headers: req.headers
    });
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Проверка наличия тела запроса
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('EMPTY REQUEST BODY', {
      headers: req.headers
    });
    return res.status(400).json({ error: 'Empty body' });
  }

  try {
    console.log(`[PROCESSING UPDATE] ${req.body.update_id}`);
    
    // Логирование типа обновления
    const updateType = Object.keys(req.body).find(key => key !== 'update_id') || 'unknown';
    console.log(`Update type: ${updateType}`);
    
    // Обработка обновления
    await bot.handleUpdate(req.body);
    
    console.log(`[SUCCESS] Processed update ${req.body.update_id}`);
    return res.status(200).json({ ok: true });
    
  } catch (err) {
    // Детальное логирование ошибки
    const errorDetails = {
      updateId: req.body.update_id,
      updateType: Object.keys(req.body).find(key => key !== 'update_id') || 'unknown',
      error: err instanceof Error ? {
        message: err.message,
        stack: err.stack
      } : err,
      // Логируем только ключи тела для экономии места
      bodyKeys: Object.keys(req.body)
    };
    
    console.error('[WEBHOOK PROCESSING ERROR]', errorDetails);
    
    // Всегда возвращаем 200 OK для Telegram
    return res.status(200).json({ 
      error: 'Webhook processing failed but acknowledged'
    });
  }
}

// Фикс для работы на Vercel
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Keeping alive for Vercel.');
});

// Логирование необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', {
    reason,
    promise
  });
});
