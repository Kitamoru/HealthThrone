import type { NextApiRequest, NextApiResponse } from 'next';
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

  const { telegramId, newScore } = req.body;
  
  if (!telegramId || newScore === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // 1. Получаем текущий уровень выгорания пользователя
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('burnout_level')
      .eq('telegram_id', telegramId)
      .single();

    if (fetchError) throw fetchError;
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const currentLevel = userData.burnout_level || 0;
    const newLevel = Math.max(0, Math.min(100, currentLevel + newScore));

    // 2. Обновляем уровень и дату последней попытки
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        burnout_level: newLevel,
        last_attempt_date: new Date().toISOString()
      })
      .eq('telegram_id', telegramId)
      .select('burnout_level, last_attempt_date')
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      burnout_level: updatedUser.burnout_level,
      last_attempt_date: updatedUser.last_attempt_date
    });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
