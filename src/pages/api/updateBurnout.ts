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

  const { telegramId, burnoutDelta, factorsDelta } = req.body;

  if (typeof telegramId !== 'number' || typeof burnoutDelta !== 'number' || !Array.isArray(factorsDelta)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const { data, error } = await supabase.rpc('update_user_stats', {
      p_telegram_id: telegramId,
      p_burnout_delta: burnoutDelta,
      p_factors_delta: factorsDelta
    });

    if (error) {
      console.error('RPC error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
