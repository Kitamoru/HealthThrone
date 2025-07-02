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
  console.log('Received request for octalysis factors');
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    console.error('Unauthorized request:', { initData });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId || Array.isArray(userId)) {
    console.error('Invalid user ID:', userId);
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    console.error('Failed to parse user ID:', userId);
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  console.log('Fetching factors for user ID:', userIdNumber);
  
  try {
    const { data, error } = await supabase
      .from('octalysis_factors')
      .select('factor1, factor2, factor3, factor4, factor5, factor6, factor7, factor8')
      .eq('user_id', userIdNumber)
      .single();

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    if (!data) {
      console.warn('No data found for user:', userIdNumber);
    } else {
      console.log('Retrieved data from Supabase:', data);
    }

    const response: FactorsResponse = {
      factor1: data?.factor1 ?? 0,
      factor2: data?.factor2 ?? 0,
      factor3: data?.factor3 ?? 0,
      factor4: data?.factor4 ?? 0,
      factor5: data?.factor5 ?? 0,
      factor6: data?.factor6 ?? 0,
      factor7: data?.factor7 ?? 0,
      factor8: data?.factor8 ?? 0
    };

    console.log('Prepared response:', response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Unexpected error fetching octalysis factors:', {
      error,
      userId: userIdNumber,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
