import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, parseInitData } from '@/lib/telegramAuth';
import { setUserContext } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Парсим initData для получения user
  const initDataParsed = parseInitData(initData);
  const user = initDataParsed.user;
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Устанавливаем контекст пользователя для RLS
    await setUserContext(user.id);

    // Получаем список купленных спрайтов
    const { data, error } = await supabase
      .from('user_sprites')
      .select('sprite_id')
      .eq('user_id', parseInt(userId, 10));  // Преобразуем userId в число

    if (error) throw error;

    // Преобразуем в массив ID, проверяя на null
    const spriteIds = data ? data.map(item => item.sprite_id) : [];
    return res.status(200).json({ success: true, data: spriteIds });
  } catch (error) {
    console.error('Error in /api/shop/owned:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch owned sprites',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
