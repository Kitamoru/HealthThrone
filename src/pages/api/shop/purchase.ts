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

  const { userId, spriteId } = req.body;
  if (typeof userId !== 'number' || typeof spriteId !== 'number') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    console.log('Processing purchase for user:', userId, 'sprite:', spriteId);
    
    // Парсим initData для получения user
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    if (!userParam) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = JSON.parse(userParam);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Устанавливаем контекст пользователя для RLS
    await setUserContext(user.id);

    // Проверка баланса
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
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
      .eq('id', userId);

    if (updateError) throw updateError;

    // Добавление спрайта в купленные
    const { error: purchaseError } = await supabase
      .from('user_sprites')
      .insert([{ user_id: userId, sprite_id: spriteId }]);

    if (purchaseError) throw purchaseError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ error: 'Purchase failed' });
  }
}
