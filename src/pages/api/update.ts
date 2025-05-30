import type { NextApiRequest, NextApiResponse } from 'next';
import { setTimeout } from 'timers/promises';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const token = process.env.TOKEN;
    const webappUrl = process.env.WEBAPPURL;

    if (!token || !webappUrl) {
      console.error('Missing TOKEN or WEBAPPURL');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    // Разрешаем HTTP только в development
    if (process.env.NODE_ENV === 'production' && !webappUrl.startsWith('https://')) {
      console.error('Production requires HTTPS');
      return res.status(400).json({ error: 'HTTPS required in production' });
    }

    const webhookUrl = `${webappUrl.replace(/\/$/, '')}/api/webhook`;
    const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook`;

    // Парсинг ALLOWEDUPDATES с обработкой ошибок
    let allowedUpdates;
    if (process.env.ALLOWEDUPDATES) {
      try {
        allowedUpdates = JSON.parse(process.env.ALLOWEDUPDATES);
      } catch (e) {
        console.error('Invalid ALLOWEDUPDATES:', e);
        return res.status(500).json({ error: 'Invalid ALLOWEDUPDATES format' });
      }
    }

    const webhookParams = {
      url: webhookUrl,
      drop_pending_updates: true, // Исправлено: в API Telegram используется snake_case
      allowed_updates: allowedUpdates,
      secret_token: process.env.WEBHOOKSECRETTOKEN || undefined,
    };

    // Таймаут с контроллером
    const controller = new AbortController();
    const timeoutPromise = setTimeout(5000).then(() => controller.abort());

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookParams),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutPromise));

    const data = await response.json();

    // Двойная проверка ответа Telegram
    if (!response.ok || !data.ok) {
      console.error('Telegram error:', data.description);
      return res.status(500).json({
        error: 'Telegram API failure',
        details: data.description,
      });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Critical error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error',
    });
  }
}
