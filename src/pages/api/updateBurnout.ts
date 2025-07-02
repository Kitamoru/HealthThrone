import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

interface RequestBody {
  telegramId: number;
  burnoutDelta: number;
  factors: number[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegramId, burnoutDelta, factors } = req.body as RequestBody;

  if (!telegramId || typeof burnoutDelta !== 'number' || !Array.isArray(factors)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Валидация факторов
  if (factors.length !== 8 || factors.some(f => typeof f !== 'number' || f < -1 || f > 1)) {
    return res.status(400).json({ error: 'Invalid factors format' });
  }

  console.log(`[UpdateBurnout] Request for user ${telegramId} with delta: ${burnoutDelta}`);

  try {
    const { data, error } = await supabase.rpc('update_burnout_and_factors', {
      p_telegram_id: telegramId,
      p_burnout_delta: burnoutDelta,
      p_factors: factors
    });

    if (error) {
      if (error.message.includes('User not found')) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (error.message.includes('Daily limit exceeded')) {
        return res.status(429).json({ error: 'Daily attempt limit exceeded' });
      }
      
      console.error('RPC execution error:', error);
      return res.status(500).json({ 
        error: 'Database operation failed',
        code: error.code,
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      console.error('RPC returned empty result');
      return res.status(404).json({ error: 'User not found after update' });
    }

    const updatedUser = data[0];
    console.log(`[UpdateBurnout] Updated user ${telegramId}: burnout=${updatedUser.burnout_level}`);

    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (e) {
    console.error('Unhandled server error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
