import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

interface FactorsResponse {
  factor1: number;
  factor2: number;
  factor3: number;
  factor4: number;
  factor5: number;
  factor6: number;
  factor7: number;
  factor8: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FactorsResponse | { error: string }>
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const { data, error } = await supabase
      .from('octalysis_factors')
      .select('factor1, factor2, factor3, factor4, factor5, factor6, factor7, factor8')
      .eq('user_id', userIdNumber)
      .single();

    if (error || !data) {
      return res.status(200).json({
        factor1: 0,
        factor2: 0,
        factor3: 0,
        factor4: 0,
        factor5: 0,
        factor6: 0,
        factor7: 0,
        factor8: 0
      });
    }

    // Возвращаем только нужные поля
    const response: FactorsResponse = {
      factor1: data.factor1 ?? 0,
      factor2: data.factor2 ?? 0,
      factor3: data.factor3 ?? 0,
      factor4: data.factor4 ?? 0,
      factor5: data.factor5 ?? 0,
      factor6: data.factor6 ?? 0,
      factor7: data.factor7 ?? 0,
      factor8: data.factor8 ?? 0
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching octalysis factors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
