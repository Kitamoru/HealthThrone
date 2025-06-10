import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';
import { Sprite } from '@/lib/types';

interface SpritesResponse {
  success: boolean;
  data?: Sprite[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpritesResponse>
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { data: sprites, error } = await supabase
      .from('sprites')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      data: sprites || [] 
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
