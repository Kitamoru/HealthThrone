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
    const { userId, burnoutLevel } = req.body;

    if (!userId || burnoutLevel === undefined) {
      return res.status(400).json({ error: 'userId and burnoutLevel required' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        burnout_level: burnoutLevel,
        last_survey_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('telegram_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}