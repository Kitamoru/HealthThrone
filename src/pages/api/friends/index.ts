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

  // Получаем внутренний ID пользователя
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', user.id)
    .single();

  if (userError || !currentUser) {
    return res.status(500).json({ error: 'User not found in database' });
  }
  const userId = currentUser.id;

  if (req.method === 'GET') {
    try {
      // Получаем друзей с актуальными данными из users
      const { data: friends, error } = await supabase
        .from('friends')
        .select(`
          id, 
          created_at,
          friend:friend_id (id, first_name, last_name, username, burnout_level)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Преобразуем данные для удобства клиента
      const formattedFriends = friends.map(f => ({
        id: f.id,
        created_at: f.created_at,
        ...f.friend
      }));

      return res.status(200).json(formattedFriends);
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
      // Находим пользователя по username
      const { data: friendUser, error: friendError } = await supabase
        .from('users')
        .select('id')
        .eq('username', friendUsername)
        .single();

      if (friendError || !friendUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Проверяем, что друг не является самим пользователем
      if (friendUser.id === userId) {
        return res.status(400).json({ error: 'You cannot add yourself' });
      }

      // Проверяем существование связи
      const { count } = await supabase
        .from('friends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('friend_id', friendUser.id);

      if (count && count > 0) {
        return res.status(400).json({ error: 'Friend already added' });
      }

      // Добавляем связь
      const { data: newFriend, error: insertError } = await supabase
        .from('friends')
        .insert([{
          user_id: userId,
          friend_id: friendUser.id
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
