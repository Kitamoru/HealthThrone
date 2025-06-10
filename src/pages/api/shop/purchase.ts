import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';

interface PurchaseResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PurchaseResponse>
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Извлекаем пользователя Telegram
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

  const { telegramId: bodyTelegramId, spriteId } = req.body as { 
    telegramId?: number; 
    spriteId?: number 
  };

  if (bodyTelegramId === undefined || spriteId === undefined) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  // Проверяем соответствие telegramId из тела запроса и из initData
  if (bodyTelegramId !== telegramId) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    // Находим пользователя по telegram_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, coins')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !userRecord) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userRecord.id;

    // Находим спрайт
    const { data: sprite, error: spriteError } = await supabase
      .from('sprites')
      .select('price')
      .eq('id', spriteId)
      .single();

    if (spriteError || !sprite) {
      return res.status(404).json({ success: false, error: 'Sprite not found' });
    }

    const price = sprite.price;

    // Проверяем, достаточно ли монет
    if (userRecord.coins < price) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }

    // Проверяем, не куплен ли уже спрайт
    const { data: existingOwnership, error: ownershipError } = await supabase
      .from('user_sprites')
      .select('id')
      .eq('user_id', userId)
      .eq('sprite_id', spriteId)
      .maybeSingle();

    if (ownershipError) {
      throw ownershipError;
    }

    if (existingOwnership) {
      return res.status(400).json({ success: false, error: 'Sprite already purchased' });
    }

    // Используем транзакцию для атомарности
    const { error } = await supabase.rpc('purchase_sprite_transaction', {
      p_user_id: userId,
      p_sprite_id: spriteId,
      p_price: price
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ success: false, error: 'Purchase failed' });
  }
}
