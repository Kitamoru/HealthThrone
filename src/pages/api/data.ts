import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

console.log("[Data API] Initializing data API handler");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Data API] Received request', req.method, req.url);

  // Добавляем заголовки для предотвращения кеширования
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'GET') {
    console.warn('[Data API] Invalid method', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegramId } = req.query;
    console.log('[Data API] Request query:', req.query);

    if (!telegramId) {
      console.error('[Data API] telegramId is required');
      return res.status(400).json({ error: 'telegramId required' });
    }

    const telegramIdNumber = Number(telegramId);
    if (isNaN(telegramIdNumber)) {
      console.error('[Data API] Invalid telegramId format', telegramId);
      return res.status(400).json({ error: 'Invalid telegramId format' });
    }

    console.log(`[Data API] Fetching user data for ID: ${telegramIdNumber}`);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramIdNumber)
      .single();

    if (error) {
      console.error('[Data API] Database error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message
      });
    }

    if (!user) {
      console.error('[Data API] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Data API] User data found:', JSON.stringify(user, null, 2));
    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('[Data API] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
