import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateTelegramInitData } from '../../../lib/telegramAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, spriteId } = req.body;

  try {
    // Проверка владения спрайтом
    const { count, error: checkError } = await supabase
      .from('user_sprites')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('sprite_id', spriteId);

    if (checkError || count === 0) {
      return res.status(400).json({ error: 'Sprite not owned' });
    }

    // Установка спрайта
    const { error: updateError } = await supabase
      .from('users')
      .update({ current_sprite_id: spriteId })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Equip error:', error);
    return res.status(500).json({ error: 'Equip failed' });
  }
}
