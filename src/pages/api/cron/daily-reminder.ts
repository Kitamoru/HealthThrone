import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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
    
    const sendPromises = activeUsers.map(user => 
      sendTelegramMessage(user.telegram_id, user.first_name, botToken)
    );

    Promise.allSettled(sendPromises).then(results => {
      const successes = results.filter(r => r.status === 'fulfilled').length;
      console.log(`Sent ${successes}/${activeUsers.length} text messages`);
    });

    return res.status(200).json({
      success: true,
      message: `Processing ${activeUsers.length} text reminders`
    });

  } catch (error) {
    console.error('Error sending daily reminders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция отправки текстового сообщения
async function sendTelegramMessage(
  telegramId: number,
  firstName: string,
  botToken: string
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const text = `Привет, ${firstName}! ⚔️ Пора пройти ежедневное испытание и получить награду!`;
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: text,
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

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error sending to ${telegramId}:`, error.description);
      
      if (error.description.includes('bot was blocked')) {
        await supabase
          .from('users')
          .update({ last_login_date: '2000-01-01' })
          .eq('telegram_id', telegramId);
      }
    }
  } catch (error) {
    console.error(`Error sending message to ${telegramId}:`, error);
  } finally {
    clearTimeout(timeout);
  }
}
