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

  try {
    // Вызываем SQL-процедуру для одновременного обновления данных
    const { data, error } = await supabase.rpc('update_burnout', {
      p_telegram_id: telegramId,
      p_score_delta: newScore
    });

    if (error) throw error;

    console.log(`[UpdateBurnout] Updated user ${telegramId}`);

    return res.status(200).json({
      success: true,
      user: data
    });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
