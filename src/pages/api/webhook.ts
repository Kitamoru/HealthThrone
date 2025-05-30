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
    
    // Создаем клавиатуру
    const keyboard = Markup.inlineKeyboard([
      Markup.button.webApp('🌐 Открыть приложение', webAppUrl),
      Markup.button.callback('📊 Статистика', 'stats')
    ]);

    // Экранированное сообщение для MarkdownV2
    const escapedMessage = '🔥 Добро пожаловать\\!';
    
    // Отправляем сообщение
    await ctx.reply(escapedMessage, {
      reply_markup: keyboard.reply_markup,
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true }
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
  
  // Безопасное сравнение токенов
  const safeCompare = (a: string, b: string) => {
    try {
      const aBuf = Buffer.from(a);
      const bBuf = Buffer.from(b);
      return crypto.timingSafeEqual(aBuf
