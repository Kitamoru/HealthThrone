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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegramId, spriteId } = req.body;
  if (!telegramId || !spriteId) {
    return res.status(400).json({ error: 'telegramId and spriteId required' });
  }

  try {
    // Находим пользователя по telegram_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !userRecord) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userId = userRecord.id;

    // Проверяем, что спрайт принадлежит пользователю
    const { data: ownership, error: ownershipError } = await supabase
      .from('user_sprites')
      .select('id')
      .eq('user_id', userId)
      .eq('sprite_id', spriteId)
      .single();

    if (ownershipError || !ownership) {
      return res.status(400).json({ error: 'Sprite not owned by user' });
    }

    // Обновляем текущий спрайт пользователя
    const { error } = await supabase
      .from('users')
      .update({ current_sprite_id: spriteId })
      .eq('telegram_id', telegramId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to equip sprite' });
  }
}
