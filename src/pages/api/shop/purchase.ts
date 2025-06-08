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

 // ... предыдущий код без изменений ...

try {
  console.log('Processing purchase for user:', telegramId, 'sprite:', spriteId);
  
  // Устанавливаем контекст
    await setUserContext(telegramId);

    // Проверяем существование спрайта
    const { data: sprite, error: spriteError } = await supabase
      .from('sprites')
      .select('price')
      .eq('id', spriteId)
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

  const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, coins')
      .eq('telegram_id', telegramId)
      .single();

  // Обновление баланса
  const updatePromise = supabase
      .from('users')
      .update({ coins: userData.coins - sprite.price })
      .eq('telegram_id', telegramId);

    const insertPromise = supabase
      .from('user_sprites')
      .insert([{ 
        user_id: userData.id,
        sprite_id: spriteId 
      }]);
 const [updateResult, insertResult] = await Promise.all([updatePromise, insertPromise]);

  if (purchaseError) throw purchaseError;

  return res.status(200).json({ success: true });
} catch (error) {
  console.error('Purchase error:', error);
  return res.status(500).json({ error: 'Purchase failed' });
}
}
