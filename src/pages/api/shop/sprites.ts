import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';
import { Sprite } from '@/lib/types';

interface SpritesResponse {
  success: boolean;
  status?: number;
  data?: Sprite[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpritesResponse>
) {
  console.log('[API][Sprites] Received request');

  const initData = req.headers['x-telegram-init-data'] as string;
  const authResult = validateTelegramInitData(initData);
  
  if (!authResult.isValid) {
    console.error('[API][Sprites] 🚫 Authorization failed:', authResult.error);
    return res.status(401).json({ 
      success: false, 
      error: `Unauthorized: ${authResult.error}` 
    });
  }

  if (req.method !== 'GET') {
    console.error(`[API][Sprites] 🚫 Method not allowed: ${req.method}`);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('[API][Sprites] Fetching sprites from Supabase...');
    const { data: sprites, error } = await supabase.rpc('get_sprites');

    if (error) {
      console.error('[API][Sprites] ❌ Supabase error:', error);
      throw error;
    }

    // Валидация структуры данных
    const isValidData = Array.isArray(sprites) && 
      (sprites.length === 0 || (
        typeof sprites[0]?.id === 'number' &&
        typeof sprites[0]?.name === 'string'
      ));

    if (!isValidData) {
      console.error('[API][Sprites] ❌ Invalid data structure:', sprites);
      throw new Error('Invalid sprites data structure from database');
    }

    console.log(`[API][Sprites] ✅ Retrieved ${sprites.length} sprites`);
    return res.status(200).json({ 
      success: true, 
      data: sprites 
    });

  } catch (error: any) {
    console.error('[API][Sprites] 🔥 Critical error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
