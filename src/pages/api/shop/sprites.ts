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
  console.log('Received request for /api/sprites');

  const initData = req.headers['x-telegram-init-data'] as string;
  console.log('Telegram initData present:', !!initData);

  if (!initData || !validateTelegramInitData(initData)) {
    console.error('🚫 Authorization failed.');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    console.error(`🚫 Method not allowed: ${req.method}`);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Fetching sprites from Supabase...');
    const { data: sprites, error } = await supabase
      .from('sprites')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log(`✅ Retrieved ${sprites?.length || 0} sprites`, sprites); // Отладочная печать результата
    return res.status(200).json({ 
      success: true, 
      data: sprites || []
    });

  } catch (error) {
    console.error('🔥 Critical error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
