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
    
    // Диагностика: проверка доступности чата с тестовым пользователем
    const TEST_USER_ID = 425693173; // ID Булата
    try {
      const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${TEST_USER_ID}`);
      const testData = await testResponse.json();
      console.log('Тест доступности чата:', JSON.stringify(testData));
      
      if (!testData.ok) {
        console.error(`Ошибка доступа к чату ${TEST_USER_ID}: ${testData.description}`);
      } else {
        console.log(`Пользователь ${TEST_USER_ID} доступен:`, testData.result);
      }
    } catch (testError) {
      console.error('Ошибка проверки чата:', testError);
    }

    // Отправка сообщений с задержкой
    const results = [];
    for (let i = 0; i < activeUsers.length; i++) {
      const user = activeUsers[i];
      console.log(`[${i+1}/${activeUsers.length}] Sending to ${user.telegram_id} (${user.first_name})`);
      
      try {
        const result = await sendTelegramMessage(user.telegram_id, user.first_name, botToken);
        results.push({ status: 'success', user, result });
        console.log(`[${user.telegram_id}] Message sent successfully`);
      } catch (error: any) {
        results.push({ status: 'error', user, error: error.message });
        console.error(`[${user.telegram_id}] Failed to send:`, error.message);
      }
      
      // Задержка 300 мс между сообщениями
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const successes = results.filter(r => r.status === 'success').length;
    const failures = results.filter(r => r.status === 'error').length;
    
    console.log(`Message delivery report:
      Success: ${successes}
      Failed: ${failures}
    `);
    
    // Логирование деталей ошибок
    results.filter(r => r.status === 'error').forEach((failure, index) => {
      console.error(`[${index+1}] User ${failure.user.telegram_id} error:`, failure.error);
    });

    return res.status(200).json({
      success: true,
      message: `Processed ${activeUsers.length} users (${successes} success, ${failures} failed)`,
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
  const timeout = setTimeout(() => controller.abort(), 15000); // Увеличено до 15 секунд
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    // Упрощенное сообщение без кнопки
    const text = `Привет, ${firstName}! Пора пройти ежедневное испытание и получить награду!`;
    
    const payload = {
      chat_id: telegramId,
      text: text,
      parse_mode: 'Markdown', // Более простой режим разметки
    };

    console.log(`[${telegramId}] Sending message: ${text.substring(0, 30)}...`);
    console.debug(`[${telegramId}] Request payload:`, JSON.stringify(payload));

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
