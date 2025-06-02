import crypto from 'crypto';

export function validateTelegramInitData(initData: string): boolean {
  const BOT_TOKEN = process.env.BOT_TOKEN!;
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
    .update(BOT_TOKEN)
    .digest();
  
  const computedHash = crypto.createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');

  return computedHash === hash;
}
