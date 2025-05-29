import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const token = process.env.TOKEN!;
    const webhookUrl = `${process.env.WEBAPP_URL}/api/webhook`;
    
    // Формируем URL для Telegram API
    const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook`;
    
    // Отправляем POST-запрос с JSON-телом
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        drop_pending_updates: true
      })
    });

    const data = await response.json();
    
    console.log('Webhook set:', data);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      error: 'Failed to set webhook',
      details: error.message 
    });
  }
}
