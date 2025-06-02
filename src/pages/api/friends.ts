import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  // Получаем друзей пользователя
  const { data: friends, error } = await supabase
    .from('friends')
    .select(`
      id,
      friend_telegram_id,
      friend_username,
      friend_burnout_level,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  res.status(200).json({ 
    success: true, 
    friends: friends || [] 
  });
}
