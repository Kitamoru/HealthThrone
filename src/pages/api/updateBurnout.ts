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
  const { data, error } = await supabase.rpc('update_burnout', {
    p_telegram_id: telegramId,
    p_new_score: newScore
  });

  if (error) {
    console.error('RPC error:', error);
    return res.status(400).json({ error: error.message });
  }

  // Возвращаем обновленный уровень и флаг успешного обновления
  return res.status(200).json({
    success: true,
    burnout_level: data.burnout_level
  });
} catch (e) {
  console.error('Server error:', e);
  return res.status(500).json({ error: 'Internal server error' });
}
}
