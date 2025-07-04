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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString().split('T')[0];
    
    console.log(`Fetching active users since ${dateFilter}`);
    
    const { data: activeUsers, error } = await supabase
      .from('users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .gte('last_login_date', dateFilter)
      .limit(100);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log(`Found ${activeUsers?.length || 0} active users`);
    
    if (!activeUsers?.length) {
      console.log('No active users found');
      return res.status(200).json({ success: true, message: 'No active users' });
    }

    const botToken = process.env.TOKEN!;
    console.log(`Starting message sending to ${activeUsers.length} users`);
    
    const sendPromises = activeUsers.map(user => {
      console.log(`Queuing message for user ${user.telegram_id} (${user.first_name})`);
      return sendTelegramMessage(user.telegram_id, user.first_name, botToken);
    });

    Promise.allSettled(sendPromises).then(results => {
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Message delivery report: 
        Success: ${successes}
        Failed: ${failures}
      `);
      
      // Детализация ошибок
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[User ${activeUsers[index].telegram_id}] Failed:`, result.reason);
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: `Processing ${activeUsers.length} text reminders`
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
  const timeout = setTimeout(() => controller.abort(), 10000);
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const text = `Привет, ${firstName}! ⚔️ Пора пройти ежедневное испытание и получить награду!`;
    const payload = {
      chat_id: telegramId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{
          text: 'Пройти испытание',
          url: process.env.WEBAPPURL
        }]]
      }
    };

    console.log(`[${telegramId}] Sending message:`, text.substring(0, 50) + '...');
    console.debug(`[${telegramId}] WebApp URL:`, process.env.WEBAPPURL);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseData = await response.json();
    console.log(`[${telegramId}] Telegram API response:`, JSON.stringify(responseData));

    if (!response.ok) {
      console.error(`[${telegramId}] Telegram API error:`, responseData.description);
      
      if (responseData.description.includes('bot was blocked')) {
        console.log(`[${telegramId}] User blocked bot, updating database`);
        await supabase
          .from('users')
          .update({ last_login_date: '2000-01-01' })
          .eq('telegram_id', telegramId);
      }
      throw new Error(`Telegram error: ${responseData.description}`);
    }

    console.log(`[${telegramId}] Message delivered successfully`);
    return responseData;

  } catch (error) {
    console.error(`[${telegramId}] Send message failed:`, error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
