import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; data?: number[]; error?: string }>
) {
  console.log('Received request for octalysis factors');
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    console.error('Unauthorized request:', { initData });
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId || Array.isArray(userId)) {
    console.error('Invalid user ID:', userId);
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    console.error('Failed to parse user ID:', userId);
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
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
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    if (!data) {
      console.warn('No data found for user:', userIdNumber);
      return res.status(200).json({ 
        success: true, 
        data: [0, 0, 0, 0, 0, 0, 0, 0] 
      });
    }

    console.log('Retrieved data from Supabase:', data);
    const factorsArray = [
      data.factor1,
      data.factor2,
      data.factor3,
      data.factor4,
      data.factor5,
      data.factor6,
      data.factor7,
      data.factor8
    ];

    console.log('Prepared response array:', factorsArray);
    res.status(200).json({
      success: true,
      data: factorsArray
    });
    
  } catch (error) {
    console.error('Unexpected error fetching octalysis factors:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: userIdNumber,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
