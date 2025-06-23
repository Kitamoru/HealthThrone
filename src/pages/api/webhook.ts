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

// Функция для безопасного извлечения свойств ошибки
const getErrorDetails = (err: unknown) => {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
      raw: err
    };
  }
  return {
    message: String(err),
    stack: undefined,
    raw: err
  };
};

// Глобальный обработчик ошибок - только логирование
bot.catch((err, ctx) => {
  const errorDetails = getErrorDetails(err);
  
  console.error(`[BOT GLOBAL ERROR]`, {
    updateId: ctx.update.update_id,
    updateType: Object.keys(ctx.update).find(key => key !== 'update_id') || 'unknown',
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    error: errorDetails
  });
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

// Обработка команды /start с улучшенной диагностикой
bot.command('start', async (ctx) => {
  try {
    console.log(`Handling /start for user: ${ctx.from.id}`);
    
    // Проверка URL веб-приложения
    if (!webAppUrl || typeof webAppUrl !== 'string') {
      throw new Error(`Invalid WEBAPPURL: ${webAppUrl}`);
    }
    
    // Формируем URL для картинки (базовый URL из WEBAPPURL)
    let imageUrl: string;
    try {
      const urlObj = new URL(webAppUrl);
      imageUrl = `${urlObj.origin}/IMG_5349.jpeg`;
    } catch (e) {
      throw new Error(`Failed to parse WEBAPPURL: ${webAppUrl}`);
    }
    
    // Создаем клавиатуру
    const keyboard = Markup.inlineKeyboard([
      Markup.button.webApp('⚔️ Отправиться в путь!', webAppUrl),
    ]);

    // Новое приветственное сообщение с HTML-разметкой
    const caption = `🔥 <b>СВЕТ ФАКЕЛОВ ОСВЕЩАЕТ ТЕБЯ В ТЕМНОТЕ ПОДЗЕМЕЛЬЯ</b>
АГА! НОВЫЙ ИСКАТЕЛЬ ПРИКЛЮЧЕНИЙ В МОРАЛЕОНЕ!

Ты забрел в подземелье мотивации. Здесь:
• Скучные опросы = 🔮 Квесты на артефакты мотивации
• Метрики команды = 🗺️ Магическая карта Октограммы
• Твоя активность = 🏆 Титулы («Убийца Апатии», «Пожиратель Целей»)!
🔮 Духи Подземелья шепчут твое имя. Ответь на зов:`;
    
    // Отправляем картинку с подписью и клавиатурой
    await ctx.replyWithPhoto(imageUrl, {
      caption: caption,
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup
    });
    
    console.log(`Successfully handled /start for user: ${ctx.from.id}`);
  } catch (err) {
    const errorDetails = getErrorDetails(err);
    console.error('[START COMMAND ERROR]', {
      userId: ctx.from?.id,
      webAppUrl: webAppUrl,
      error: errorDetails
    });
    
    try {
      await ctx.reply('❌ Не удалось обработать команду. Попробуйте ещё раз.');
    } catch (sendError) {
      console.error('Failed to send error notification:', getErrorDetails(sendError));
    }
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
    const errorDetails = getErrorDetails(err);
    console.error('[STATS ACTION ERROR]', {
      userId: ctx.from?.id,
      error: errorDetails
    });
    
    try {
      await ctx.answerCbQuery('❌ Ошибка при загрузке статистики');
    } catch (answerError) {
      console.error('Failed to answer callback:', getErrorDetails(answerError));
    }
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
  
  // Безопасное сравнение токенов (ИСПРАВЛЕННАЯ ФУНКЦИЯ)
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
    const errorDetails = getErrorDetails(err);
    // Детальное логирование ошибки
    console.error('[WEBHOOK PROCESSING ERROR]', {
      updateId: req.body.update_id,
      updateType: Object.keys(req.body).find(key => key !== 'update_id') || 'unknown',
      error: errorDetails,
      bodyKeys: Object.keys(req.body)
    });
    
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
  console.error('[UNCAUGHT EXCEPTION]', getErrorDetails(error));
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', {
    reason: getErrorDetails(reason)
  });
});
