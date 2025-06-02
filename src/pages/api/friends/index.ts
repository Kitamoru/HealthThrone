import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateTelegramInitData } from '../../../lib/telegramAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = extractUserFromInitData(initData);
  if (!user?.id) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    const { friendUsername } = req.body;
    
    if (!friendUsername) {
      return res.status(400).json({ error: 'Friend username is required' });
    }

    try {
      // Проверяем, что друг не является самим пользователем
      if (friendUsername === user.username) {
        return res.status(400).json({ error: 'You cannot add yourself' });
      }

      // Проверяем, что друг еще не добавлен
      const { data: existingFriend, error: existingError } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_username', friendUsername)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingFriend) {
        return res.status(400).json({ error: 'Friend already added' });
      }

      // Добавляем друга
      const { data: newFriend, error: insertError } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_username: friendUsername,
          burnout_level: 0
        }])
        .single();

      if (insertError) throw insertError;
      return res.status(201).json(newFriend);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to add friend' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Вспомогательная функция для извлечения пользователя
function extractUserFromInitData(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
}
