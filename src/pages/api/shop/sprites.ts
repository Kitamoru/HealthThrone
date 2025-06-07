import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all sprites
    const { data: sprites, error } = await supabase
      .from('sprites')
      .select('*');

    if (error) throw error;

    return res.status(200).json({ success: true, data: sprites });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sprites' });
  }
}
