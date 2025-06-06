import crypto from 'crypto';

export function validateTelegramInitData(initData: string): boolean {
  const TOKEN = process.env.TOKEN!;
  const data = new URLSearchParams(initData);
  const hash = data.get('hash');
  data.delete('hash');

  // Сортируем параметры по ключу
  const entries = Array.from(data.entries()).sort(([key1], [key2]) => 
    key1.localeCompare(key2)
  );
  
  const dataString = entries.map(
    ([key, value]) => `${key}=${value}`
  ).join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData')
    .update(TOKEN)
    .digest();
  
  const computedHash = crypto.createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');
  
// lib/telegramAuth.ts
export function parseInitData(initData: string): { user?: any } {
  const params = new URLSearchParams(initData);
  const userParam = params.get('user');
  if (!userParam) return {};
  try {
    return { user: JSON.parse(userParam) };
  } catch (e) {
    console.error('Failed to parse user from initData', e);
    return {};
  }
}

  return computedHash === hash;
}
