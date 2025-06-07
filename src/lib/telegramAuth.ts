import crypto from 'crypto';

export const validateTelegramInitData = (initData: string): boolean => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;
    params.delete('hash');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TOKEN!)
      .digest();

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hash === calculatedHash;
  } catch (err) {
    return false;
  }
};
