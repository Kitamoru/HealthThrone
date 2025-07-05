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

    // Вызываем транзакционную функцию
    const { data, error } = await supabase
      .rpc('purchase_sprite_transaction', {
        p_telegram_id: telegramId,
        p_sprite_id: spriteId
      })
      .select()
      .single();

    if (error) {
      console.error('Transaction error:', error.message);
      
      // Обработка специфичных ошибок
      let errorMessage = 'Purchase failed';
      if (error.message.includes('User not found')) errorMessage = 'User not found';
      if (error.message.includes('Sprite not found')) errorMessage = 'Sprite not found';
      if (error.message.includes('Insufficient coins')) errorMessage = 'Insufficient coins';
      
      return res.status(400).json({ 
        success: false, 
        error: errorMessage 
      });
    }

    return res.status(200).json({ 
      success: true,
      data: {
        coins: data.new_coins,
        spriteId
      }
    });
    
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Purchase error:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
