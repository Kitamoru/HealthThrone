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
  // Логирование входящих данных
  console.log('Incoming request:', {
    method: req.method,
    headers: req.headers,
    query: req.query
  });

  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    console.log('Failed authorization:', initData);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId || Array.isArray(userId)) {
    console.log('Invalid user ID:', userId);
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    console.log('Failed to parse user ID:', userId);
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    console.log('Fetching data for user:', userIdNumber);
    const { data, error } = await supabase
      .from('octalysis_factors')
      .select('*')
      .eq('user_id', userIdNumber)
      .single();

    if (error) {
      console.error('Database error:', error);
    }

    if (error || !data) {
      console.log('No data found for user:', userIdNumber);
      return res.status(200).json({
        factor1: data?.factor1 ?? 0,
        factor2: data?.factor2 ?? 0,
        factor3: data?.factor3 ?? 0,
        factor4: data?.factor4 ?? 0,
        factor5: data?.factor5 ?? 0,
        factor6: data?.factor6 ?? 0,
        factor7: data?.factor7 ?? 0,
        factor8: data?.factor8 ?? 0
    });
    }

    console.log('Data fetched:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching octalysis factors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
