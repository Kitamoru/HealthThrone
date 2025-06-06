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

  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Получаем список купленных спрайтов
    const { data, error } = await supabase
      .from('user_sprites')
      .select('sprite_id')
      .eq('user_id', userId);

    if (error) throw error;

    // Преобразуем в массив ID
    const spriteIds = data.map(item => item.sprite_id);
    return res.status(200).json({ success: true, data: spriteIds });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch owned sprites' });
  }
}
