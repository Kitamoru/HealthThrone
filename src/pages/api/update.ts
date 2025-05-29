
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  {
    auth: { persistSession: false }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, delta } = req.body;

    if (!user_id || typeof delta !== 'number') {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const { error } = await supabase.rpc('update_burnout', {
      user_id,
      delta
    });

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    res.json({ 
      success: true, 
      data: { status: 'ok' } 
    });

  } catch (err: any) {
    console.error('Update error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Update failed',
      details: err.message
    });
  }
}
