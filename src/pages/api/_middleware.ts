import { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';

export function validateInitData(initData: string): boolean {
  const botToken = process.env.TOKEN;
  if (!botToken) {
    console.error('TOKEN is not set');
    return false;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Сортируем параметры по ключу
    const dataToCheck = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = createHmac('sha256', secret).update(dataToCheck).digest('hex');

    return computedHash === hash;
  } catch (error) {
    console.error('Error validating initData:', error);
    return false;
  }
}
