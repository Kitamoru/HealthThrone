import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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
      .eq('telegram_id', TARGET_USER_ID) // Фильтр по конкретному ID
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
    
    // Отправляем сообщение только целевому пользователю
    const results = [];
    for (const user of activeUsers) {
      try {
        console.log(`Sending to target user ${user.telegram_id} (${user.first_name})`);
        const result = await sendTelegramMessage(user.telegram_id, user.first_name, botToken);
        results.push({ status: 'success', user, result });
        console.log(`[${user.telegram_id}] Message sent successfully`);
      } catch (error: any) {
        results.push({ status: 'error', user, error: error.message });
        console.error(`[${user.telegram_id}] Failed to send:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed target user`,
      details: results
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendTelegramMessage(
  telegramId: number,
  firstName: string,
  botToken: string
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const text = `Привет, ${firstName}! ⚔️ Пора пройти ежедневное испытание и получить награду!`;
    
    const payload = {
      chat_id: telegramId,
      text: text,
      parse_mode: 'Markdown',
    };

    console.log(`[${telegramId}] Sending message: ${text.substring(0, 30)}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseData = await response.json();
    console.log(`[${telegramId}] Telegram API response:`, JSON.stringify(responseData));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${responseData.description}`;
      console.error(`[${telegramId}] Telegram API error:`, errorMessage);
      
      // Обновляем статус пользователя при ошибках
      if (responseData.description.includes('bot was blocked')) {
        console.log(`[${telegramId}] User blocked bot, updating database`);
        await supabase
          .from('users')
          .update({ last_login_date: '2000-01-01' })
          .eq('telegram_id', telegramId);
      }
      
      if (responseData.description.includes('chat not found')) {
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
    console.error(`[${telegramId}] Send message failed:`, error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
