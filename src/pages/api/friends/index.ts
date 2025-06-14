import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateTelegramInitData } from '../../../lib/telegramAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const user = extractUserFromInitData(initData);
  if (!user?.id) {
    return res.status(400).json({ success: false, error: 'Invalid user data' });
  }

  try {
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', user.id)
      .single();

    if (userError || !currentUser) {
      return res.status(404).json({ success: false, error: 'User not found in database' });
    }
    const userId = currentUser.id;

    if (req.method === 'GET') {
      const { data: friends, error } = await supabase
        .from('friends')
        .select(`
          id, 
          created_at,
          friend:friend_id (id, first_name, last_name, username, burnout_level)
        `)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: friends.map(f => ({
          id: f.id,
          friend: {
            id: f.friend.id,
            username: f.friend.username || 
                      `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
            burnout_level: f.friend.burnout_level
          }
        })) 
      });
    }

    if (req.method === 'POST') {
      const { friendUsername } = req.body;

      if (!friendUsername) {
        return res.status(400).json({ success: false, error: 'Friend username is required' });
      }

      const { data: friendUser, error: friendError } = await supabase
        .from('users')
        .select('id')
        .eq('username', friendUsername)
        .single();

      if (friendError || !friendUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (friendUser.id === userId) {
        return res.status(400).json({ success: false, error: 'You cannot add yourself' });
      }

      const { count } = await supabase
        .from('friends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('friend_id', friendUser.id);

      if (count && count > 0) {
        return res.status(400).json({ success: false, error: 'Friend already added' });
      }

      const { data: newFriend, error: insertError } = await supabase
        .from('friends')
        .insert([{
          user_id: userId,
          friend_id: friendUser.id
        }])
        .select(`
          id,
          friend:friend_id (id, first_name, last_name, username, burnout_level)
        `)
        .single();

      if (insertError) {
        return res.status(500).json({ success: false, error: 'Failed to add friend' });
      }

      return res.status(201).json({ 
        success: true,
        data: {
          id: newFriend.id,
          friend: {
            id: newFriend.friend.id,
            username: newFriend.friend.username || 
                      `${newFriend.friend.first_name} ${newFriend.friend.last_name || ''}`.trim(),
            burnout_level: newFriend.friend.burnout_level
          }
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

function extractUserFromInitData(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
}
