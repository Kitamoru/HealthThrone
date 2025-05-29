/**
 * API-роут для настройки вебхука Telegram-бота.
 * @param req - Next.js API Request
 * @param res - Next.js API Response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const token = process.env.TOKEN;
    const webappUrl = process.env.WEBAPPURL;

    // Проверка переменных окружения
    if (!token || !webappUrl) {
      console.error('Missing environment variables: TOKEN or WEBAPPURL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Проверка HTTPS
    if (!webappUrl.startsWith('https://')) {
      console.error('Webhook URL must use HTTPS');
      return res.status(400).json({ error: 'Webhook URL must use HTTPS' });
    }

    // Формирование URL вебхука
    const webhookUrl = `${webappUrl.replace(/\/$/, '')}/api/webhook`;
    const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook`;

    console.log('Setting webhook:', { telegramUrl, webhookUrl });

    // Параметры вебхука
    const webhookParams = {
      url: webhookUrl,
      droppendingupdates: true,
      allowedupdates: process.env.ALLOWEDUPDATES ? JSON.parse(process.env.ALLOWEDUPDATES) : undefined,
      secrettoken: process.env.WEBHOOKSECRETTOKEN || undefined,
    };

    // Отправка запроса к Telegram API
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookParams),
      signal: AbortSignal.timeout(5000), // Таймаут 5 секунд
    });

    const data = await response.json();

    // Проверка ответа Telegram API
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: 'Failed to set webhook', details: data.description });
    }

    console.log('Webhook set successfully:', data);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error setting webhook:', error);
    return res.status(500).json({
      error: 'Failed to set webhook',
      details: error.message || 'Unknown error occurred',
    });
  }
}
