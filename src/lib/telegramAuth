import crypto from 'crypto';

export function validateInitData(initData: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      console.error('BOT_TOKEN is not defined');
      return false;
    }

    const dataToCheck: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') {
        dataToCheck.push(`${key}=${value}`);
      }
    });

    dataToCheck.sort();
    const dataString = dataToCheck.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');

    return computedHash === hash;
  } catch (error) {
    console.error('Error validating initData:', error);
    return false;
  }
}
