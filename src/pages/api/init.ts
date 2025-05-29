
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  {
    auth: { persistSession: false }
  }
);

const verifyTelegramData = (initData: string): boolean => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TOKEN!)
      .digest();

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    return hash === calculatedHash;
  } catch (err) {
    console.error('Telegram hash verification failed:', err);
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData required' });
    }

    if (!verifyTelegramData(initData)) {
      console.warn('Invalid Telegram auth data');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    const user_id = user?.id;

    if (!user_id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        user_id,
        username: user?.username,
        first_name: user?.first_name,
        burnout_level: 5
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      throw new Error(`Upsert error: ${upsertError.message}`);
    }

    const { data, error: selectError } = await supabase
      .from('users')
      .select('burnout_level')
      .eq('user_id', user_id)
      .single();

    if (selectError) {
      throw new Error(`Select error: ${selectError.message}`);
    }

    res.json({
      success: true,
      data: { burnout_level: data?.burnout_level || 5 }
    });

  } catch (err: any) {
    console.error('Init error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
