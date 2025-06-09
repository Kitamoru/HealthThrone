import crypto from 'crypto';

export const validateTelegramInitData = (initData: string): boolean => {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  // Проверяем срок действия данных (не старше 1 часа)
  const authDate = params.get('auth_date');
  if (authDate && Date.now() - parseInt(authDate) * 1000 > 3600000) {
    return false;

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
