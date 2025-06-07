import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Парсинг initData: извлекаем и декодируем данные пользователя
    const params = new URLSearchParams(initData);
    const userString = params.get('user');
    if (!userString) {
      return res.status(401).json({ error: 'Unauthorized: user data missing' });
    }
    const user = JSON.parse(userString);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Получаем все спрайты
    const { data: sprites, error } = await supabase
      .from('sprites')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ success: true, data: sprites });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
