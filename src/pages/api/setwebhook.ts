// api/setWebhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Разрешаем только GET-запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const token = process.env.TOKEN!;
    // Убедитесь, что URL вебхука правильный:
    const webhookUrl = `${process.env.WEBAPP_URL}/api/webhook`;
    
    const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;

    const response = await fetch(telegramUrl);
    const data = await response.json();

    console.log('Webhook set:', data);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ error: 'Failed to set webhook' });
  }
}
