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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('burnout_level')
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ 
          success: true, 
          data: { burnout_level: 5 } 
        });
      }
      throw new Error(`Select error: ${error.message}`);
    }

    res.json({ 
      success: true, 
      data: { burnout_level: data?.burnout_level || 5 } 
    });

  } catch (err: any) {
    console.error('Data fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch data' 
    });
  }
}