import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';

interface EquipResponse {
  success: boolean;
  data?: any; // Более гибкий тип данных
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EquipResponse>
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const telegramUser = extractTelegramUser(initData);
  if (!telegramUser?.id) {
    return res.status(400).json({ success: false, error: 'Invalid user data' });
  }

  const telegramId = Number(telegramUser.id);
  if (isNaN(telegramId)) {
    return res.status(400).json({ success: false, error: 'Invalid Telegram ID format' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { spriteId } = req.body as { spriteId: number };

  if (spriteId === undefined) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  try {
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !userRecord) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userRecord.id;

    const { data: ownership, error: ownershipError } = await supabase
      .from('user_sprites')
      .select('id')
      .eq('user_id', userId)
      .eq('sprite_id', spriteId)
      .single();

    if (ownershipError || !ownership) {
      return res.status(400).json({ success: false, error: 'Sprite not owned by user' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ current_sprite_id: spriteId })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Возвращаем правильный формат ответа
    return res.status(200).json({ 
      success: true,
      data: {
        spriteId,
        userId
      }
    });
    
  } catch (error) {
    console.error('Equip error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to equip sprite' 
    });
  }
}
