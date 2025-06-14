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
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      
      // Обработка структуры данных Supabase
      const formattedFriends = friends.map(f => ({
        id: f.id,
        friend: f.friend[0] // Берем первый элемент массива
      })).filter(f => f.friend); // Фильтруем невалидные записи

      return res.status(200).json({ 
        success: true, 
        data: formattedFriends.map(f => ({
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

      // Ищем пользователя по username (регистронезависимо)
      const { data: friendUser, error: friendError } = await supabase
        .from('users')
        .select('id')
        .ilike('username', friendUsername) // ILIKE для case-insensitive
        .single();

      if (friendError || !friendUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (friendUser.id === userId) {
        return res.status(400).json({ success: false, error: 'You cannot add yourself' });
      }

      // Проверка существования связи
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', userId)
        .eq('friend_id', friendUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Check friendship error:', checkError);
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (existingFriendship) {
        return res.status(400).json({ success: false, error: 'Friend already added' });
      }

      // Создаем связь
      const { data: newFriendship, error: insertError } = await supabase
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
        console.error('Insert error:', insertError);
        return res.status(500).json({ success: false, error: 'Failed to add friend' });
      }

      // Проверка структуры ответа
      if (!newFriendship.friend || !Array.isArray(newFriendship.friend) || newFriendship.friend.length === 0) {
        console.error('Invalid friend data structure:', newFriendship);
        return res.status(500).json({ success: false, error: 'Invalid friend data' });
      }

      const friendData = newFriendship.friend[0];
      return res.status(201).json({ 
        success: true,
        data: {
          id: newFriendship.id,
          friend: {
            id: friendData.id,
            username: friendData.username || 
                      `${friendData.first_name} ${friendData.last_name || ''}`.trim(),
            burnout_level: friendData.burnout_level
          }
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

function extractUserFromInitData(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}
