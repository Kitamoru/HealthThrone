import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';
import { ApiResponse } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!validateTelegramInitData(initData)) {
    return res.status(401).json({ 
      success: false, 
      status: 401,
      error: 'Unauthorized' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      status: 405,
      error: 'Method not allowed' 
    });
  }

  const { telegramId, spriteId } = req.body;
  if (typeof telegramId !== 'number' || typeof spriteId !== 'number') {
    return res.status(400).json({ 
      success: false,
      status: 400,
      error: 'Invalid request body' 
    });
  }

  try {
    // Начало транзакции
    const transaction = await supabase.rpc('purchase_sprite_transaction', {
      p_telegram_id: telegramId,
      p_sprite_id: spriteId
    });

    if (transaction.error) {
      throw transaction.error;
    }

    return res.status(200).json({ success: true, status: 200 });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      error: 'Purchase failed'
    });
  }
}
