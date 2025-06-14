// purchase.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateTelegramInitData } from '../../../lib/telegramAuth';
import { setUserContext } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { telegramId, spriteId } = req.body;

  if (typeof telegramId !== 'number' || typeof spriteId !== 'number') {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  try {
    console.log(`Processing purchase for user ${telegramId}, sprite ${spriteId}`);

    await setUserContext(telegramId);

    const [userDataRes, spriteRes] = await Promise.all([
      supabase.from('users').select('id, coins').eq('telegram_id', telegramId).single(),
      supabase.from('sprites').select('price').eq('id', spriteId).single()
    ]);

    if (userDataRes.error || spriteRes.error) {
      return res.status(500).json({ success: false, error: 'Database fetch error' });
    }

    const userData = userDataRes.data;
    const sprite = spriteRes.data;

    if (!userData || !sprite) {
      return res.status(400).json({ success: false, error: 'User or Sprite not found' });
    }

    const price = sprite.price;

    if (userData.coins < price) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }

    const updatePromise = supabase
      .from('users')
      .update({ coins: userData.coins - price })
      .eq('telegram_id', telegramId);

    const insertPromise = supabase
      .from('user_sprites')
      .insert([{ user_id: userData.id, sprite_id: spriteId }]);

    const [updateResult, insertResult] = await Promise.all([updatePromise, insertPromise]);

    if (updateResult.error || insertResult.error) {
      return res.status(500).json({
        success: false,
        error: updateResult.error?.message || insertResult.error?.message || 'Internal server error'
      });
    }

    return res.status(200).json({ 
      success: true,
      data: {
        coins: userData.coins - price,
        spriteId
      }
    });
    
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err)); // Приведение типа ошибки
    console.error('Purchase error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
