// pages/api/cron/daily-reminder.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

// Функция проверки доступности изображения
async function checkImageAvailability(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.error(`Image availability check failed: ${url}`, error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: activeUsers, error } = await supabase
      .from('users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .gte('last_login_date', sevenDaysAgo.toISOString().split('T')[0])
      .limit(100);

    if (error) throw error;
    if (!activeUsers?.length) {
      return res.status(200).json({ success: true, message: 'No active users' });
    }

    const botToken = process.env.BOT_TOKEN!;
    
    // Генерируем URL изображения с параметром для избежания кэширования
    const imageUrl = `${process.env.NEXTAUTH_URL}/IMG_5385.png?ts=${Date.now()}`;
    
    // Проверяем доступность изображения
    const isImageAvailable = await checkImageAvailability(imageUrl);
    if (!isImageAvailable) {
      console.error('Daily reminder image is not available:', imageUrl);
      return res.status(500).json({ 
        error: 'Image not available',
        details: `Failed to access image at ${imageUrl}`
      });
    }

    const sendPromises = activeUsers.map(user => 
      sendTelegramPhoto(user.telegram_id, user.first_name, botToken, imageUrl)
    );

    Promise.allSettled(sendPromises).then(results => {
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Sent ${successes}/${activeUsers.length} messages`);
      if (failures > 0) {
        console.error(`Failed to send ${failures} messages`);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Processing ${activeUsers.length} reminders with image`
    });

  } catch (error) {
    console.error('Error in daily reminder cron:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Функция отправки сообщения с изображением (исправленная)
async function sendTelegramPhoto(
  telegramId: number,
  firstName: string,
  botToken: string,
  imageUrl: string
) {
  const controller = new AbortController();
  // Увеличенный таймаут для обработки изображений
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const caption = `Привет, ${firstName}! ⚔️ Пора пройти ежедневное испытание и получить награду!`;
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        photo: imageUrl,
        caption: caption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{
            text: 'Пройти испытание',
            url: process.env.WEBAPPURL
          }]]
        }
      }),
      signal: controller.signal
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Telegram API error for ${telegramId}:`, data.description || data);
      
      // Помечаем пользователя как неактивного если бот заблокирован
      if (data.description.includes('bot was blocked')) {
        await supabase
          .from('users')
          .update({ last_login_date: '2000-01-01' })
          .eq('telegram_id', telegramId);
        console.log(`Marked user ${telegramId} as inactive (bot blocked)`);
      }
      throw new Error(data.description || 'Telegram API error');
    }
    
    return data;
  } catch (error: any) {
    // Специфичная обработка ошибки таймаута
    if (error.name === 'AbortError') {
      console.error(`⏰ Timeout sending to ${telegramId}: Image processing took too long`);
    } else {
      console.error(`❌ Error sending to ${telegramId}:`, error.message || error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
