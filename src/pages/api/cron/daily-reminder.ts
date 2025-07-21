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
    const today = new Date().toISOString().split('T')[0];
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];
    
    // Исправленный запрос: включаем NULL и значения не равные сегодня
    const { data: activeUsers, error: userError } = await supabase
      .from('users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .gt('last_login_date', sixtyDaysAgoStr)
      .or(`last_attempt_date.is.null,last_attempt_date.neq.${today}`);

    if (userError) {
      console.error('Supabase query error:', userError);
      throw userError;
    }
    
    console.log(`Found ${activeUsers?.length || 0} users to notify`);
    
    if (!activeUsers?.length) {
      console.log('No users found for notification');
      return res.status(200).json({ success: true, message: 'No users to notify' });
    }

    const botToken = process.env.TOKEN!;
    const imagePath = join(process.cwd(), 'public', 'IMG_5389.png');
    const imageBuffer = readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    const results = [];
    for (const user of activeUsers) {
      try {
        console.log(`Sending to user ${user.telegram_id} (${user.first_name})`);
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
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${activeUsers.length} users with photos`,
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
  const timeout = setTimeout(() => controller.abort(), 20000);
  const endpoint = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  try {
    const caption = `Испытание дня: Опрос Мудреца!\nНаграда: +1 к точности Октаграммы🔮`;
    
    const formData = new FormData();
    formData.append('chat_id', telegramId.toString());
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    const blob = new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/png' });
    formData.append('photo', blob, 'daily-challenge.png');
    
    if (process.env.WEBAPPURL) {
      formData.append('reply_markup', JSON.stringify({
        inline_keyboard: [
          [{
            text: '⚔️ Принять вызов',
            web_app: { url: process.env.WEBAPPURL }
          }],
          [{
            text: '📰 Вести подземелья',
            url: 'https://t.me/+CiYNPjJNjHswZDBi'
          }],
          [{
            text: '🍻 Таверна',
            url: 'https://t.me/+DFZ5TfMOhfFhMzdi'
          }]
        ]
      }));
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    const responseData = await response.json();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${responseData.description || 'Unknown error'}`;
      
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
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
