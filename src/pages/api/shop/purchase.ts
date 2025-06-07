import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateTelegramInitData } from '../../../lib/telegramAuth';
import { setUserContext } from '../../../lib/supabase';

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
  if (typeof telegramId !== 'number' || typeof spriteId !== 'number') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    console.log('Processing purchase for user:', telegramId, 'sprite:', spriteId);
    
    // Устанавливаем контекст пользователя для RLS
    await setUserContext(telegramId);

    // Проверка баланса
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('telegram_id', telegramId)
      .single();

    if (userError) throw userError;
    if (!userData) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Получаем цену спрайта
    const { data: sprite, error: spriteError } = await supabase
      .from('sprites')
      .select('price')
      .eq('id', spriteId)
      .single();

    if (spriteError) throw spriteError;
    if (!sprite) {
      return res.status(400).json({ error: 'Sprite not found' });
    }

    const price = sprite.price;

    if (userData.coins < price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Обновление баланса
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: userData.coins - price })
      .eq('telegram_id', telegramId);

    if (updateError) throw updateError;

    // Добавление спрайта в купленные (ИСПРАВЛЕННАЯ СТРОКА)
    const { error: purchaseError } = await supabase
      .from('user_sprites')
      .insert([{ user: telegramId, sprite_id: spriteId }]); // <-- Замена telegram_id на telegramId

    if (purchaseError) throw purchaseError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ error: 'Purchase failed' });
  }
}
