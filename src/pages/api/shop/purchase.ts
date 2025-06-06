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

  const { userId, spriteId, price } = req.body;

  try {
    // Проверка баланса
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    if (!user || user.coins < price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Обновление баланса
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: user.coins - price })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Добавление спрайта
    const { error: purchaseError } = await supabase
      .from('user_sprites')
      .insert([{ user_id: userId, sprite_id: spriteId }]);

    if (purchaseError) throw purchaseError;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Purchase failed' });
  }
}
