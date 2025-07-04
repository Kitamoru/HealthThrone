import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Cron job triggered at', new Date().toISOString());
  
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const TARGET_USER_ID = 425693173; // ID целевого пользователя
    
    // Получаем только целевого пользователя
    const { data: activeUsers, error } = await supabase
      .from('users')
      .select('telegram_id, first_name')
      .eq('telegram_id', TARGET_USER_ID)
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log(`Found ${activeUsers?.length || 0} target users`);
    
    if (!activeUsers?.length) {
      console.log('Target user not found');
      return res.status(200).json({ success: true, message: 'Target user not found' });
    }

    const botToken = process.env.TOKEN!;
    
    // Загружаем изображение из public-директории
    const imagePath = join(process.cwd(), 'public', 'IMG_5389.png');
    const imageBuffer = readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Отправляем сообщение с изображением целевому пользователю
    const results = [];
    for (const user of activeUsers) {
      try {
        console.log(`Sending to target user ${user.telegram_id} (${user.first_name})`);
        const result = await sendTelegramPhoto(
          user.telegram_id, 
          user.first_name, 
          botToken,
          imageBase64
        );
        results.push({ status: 'success', user, result });
        console.log(`[${user.telegram_id}] Photo sent successfully`);
      } catch (error: any) {
        results.push({ status: 'error', user, error: error.message });
        console.error(`[${user.telegram_id}] Failed to send:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed target user with photo`,
      details: results
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendTelegramPhoto(
  telegramId: number,
  firstName: string,
  botToken: string,
  imageBase64: string
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // Увеличено до 20 секунд для загрузки фото
  const endpoint = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  try {
    const caption = `Привет, ${firstName}! Пора пройти ежедневное испытание и получить награду!`;
    
    // Создаем FormData для загрузки изображения
    const formData = new FormData();
    formData.append('chat_id', telegramId.toString());
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    // Создаем Blob из base64
    const blob = new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/png' });
    formData.append('photo', blob, 'daily-challenge.png');
    
    // Добавляем кнопку, если нужно
    if (process.env.WEBAPPURL) {
      formData.append('reply_markup', JSON.stringify({
        inline_keyboard: [[{
          text: 'Пройти испытание',
          url: process.env.WEBAPPURL
        }]]
      }));
    }

    console.log(`[${telegramId}] Sending photo with caption: ${caption.substring(0, 30)}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
      // Заголовки не нужны, FormData установит multipart/form-data автоматически
    });

    const responseData = await response.json();
    console.log(`[${telegramId}] Telegram API response:`, JSON.stringify(responseData));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${responseData.description || 'Unknown error'}`;
      console.error(`[${telegramId}] Telegram API error:`, errorMessage);
      
      if (responseData.description?.includes('bot was blocked')) {
        console.log(`[${telegramId}] User blocked bot, updating database`);
        await supabase
          .from('users')
          .update({ last_login_date: '2000-01-01' })
          .eq('telegram_id', telegramId);
      }
      
      if (responseData.description?.includes('chat not found')) {
        console.log(`[${telegramId}] Chat not found, updating database`);
        await supabase
          .from('users')
          .update({ telegram_id: null })
          .eq('telegram_id', telegramId);
      }
      
      throw new Error(errorMessage);
    }

    return responseData;

  } catch (error: any) {
    console.error(`[${telegramId}] Send photo failed:`, error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
