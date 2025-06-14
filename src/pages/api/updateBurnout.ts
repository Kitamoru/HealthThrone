import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegramId, newScore } = req.body;

  if (!telegramId || typeof newScore !== 'number') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Валидация диапазона баллов
  if (newScore < -20 || newScore > 20) {
    return res.status(400).json({ error: 'Invalid score delta value' });
  }

  console.log(`[UpdateBurnout] Request for user ${telegramId} with delta: ${newScore}`);

  try {
    const { data, error } = await supabase.rpc('update_burnout', {
      p_telegram_id: telegramId,
      p_score_delta: newScore
    });

    if (error) {
      // Обработка специфических ошибок PostgreSQL
      if (error.message.includes('User not found')) {
        console.error(`User not found: ${telegramId}`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (error.message.includes('Daily limit exceeded')) {
        console.warn(`Daily limit exceeded for user: ${telegramId}`);
        return res.status(429).json({ error: 'Daily attempt limit exceeded' });
      }
      
      console.error('Database RPC error:', error);
      return res.status(500).json({ error: 'Database operation failed' });
    }

    // Проверка наличия возвращаемых данных
    if (!data || data.length === 0) {
      console.error('RPC returned empty dataset');
      return res.status(404).json({ error: 'User data not found after update' });
    }

    const updatedUser = data[0];
    console.log(`[UpdateBurnout] Updated user ${telegramId}: burnout=${updatedUser.burnout_level}`);

    return res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (e) {
    console.error('Unhandled server error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
