// pages/api/setWebhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = process.env.TOKEN!;
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
