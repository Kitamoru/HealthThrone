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

  const { telegramId, newScore } = req.body;  // Изменяем userId на telegramId
  
  if (!telegramId || newScore === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        burnout_level: Math.max(0, Math.min(100, currentLevel + newScore)),
        last_attempt_date: new Date().toISOString() // UTC дата
      })
      .eq('telegram_id', telegramId)
      .select('burnout_level, last_attempt_date')
      .single();

  if (error) {
    console.error('RPC error:', error);
    return res.status(400).json({ error: error.message });
  }

  // Возвращаем обновленный уровень и флаг успешного обновления
   return res.status(200).json({
      success: true,
      burnout_level: updatedUser.burnout_level,
      last_attempt_date: updatedUser.last_attempt_date // Возвращаем клиенту
    });
} catch (e) {
  console.error('Server error:', e);
  return res.status(500).json({ error: 'Internal server error' });
}
}
