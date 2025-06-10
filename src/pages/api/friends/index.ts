import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';
import { Friend, UserProfile } from '@/lib/types';

interface FriendsResponse {
  success: boolean;
  data?: Friend[];
  error?: string;
}

interface AddFriendResponse {
  success: boolean;
  data?: Friend;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FriendsResponse | AddFriendResponse>
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Извлекаем пользователя Telegram
  const telegramUser = extractTelegramUser(initData);
  if (!telegramUser?.id) {
    return res.status(400).json({ success: false, error: 'Invalid user data' });
  }

  const telegramId = Number(telegramUser.id);
  if (isNaN(telegramId)) {
    return res.status(400).json({ success: false, error: 'Invalid Telegram ID format' });
  }

  try {
    // Получаем внутренний ID пользователя
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single(); // single() гарантирует получение одной записи

    if (userError || !currentUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found in database' 
      });
    }
    
    const userId = currentUser.id;

    if (req.method === 'GET') {
      // Получаем список друзей
      const { data: friends, error } = await supabase
        .from('friends')
        .select(`
          id, 
          created_at,
          friend (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      // Проверяем, чтобы friend был одним объектом, а не массивом
      const formattedFriends: Friend[] = (friends || [])
        .filter(f => Array.isArray(f.friend) ? f.friend.length : true)
        .map(f => {
          let friendObj = f.friend;
          
          // Если friend - массив, берём первую запись
          if (Array.isArray(friendObj)) {
            friendObj = friendObj[0];
          }

          return {
            id: f.id,
            created_at: f.created_at,
            friend_id: friendObj.id,
            friend: {
              id: friendObj.id,
              first_name: friendObj.first_name,
              last_name: friendObj.last_name || null,
              username: friendObj.username || null,
              burnout_level: friendObj.burnout_level,
              coins: friendObj.coins || 0,
              updated_at: friendObj.updated_at
            }
          };
        });

      return res.status(200).json({
        success: true,
        data: formattedFriends
      });
    }

    if (req.method === 'POST') {
      // Добавление нового друга
      const { friendUsername } = req.body as { friendUsername?: string };
      
      if (!friendUsername) {
        return res.status(400).json({ 
          success: false,
          error: 'Friend username is required' 
        });
      }

      // Находим пользователя по username
      const { data: friendUser, error: friendError } = await supabase
        .from('users')
        .select('id, telegram_id')
        .eq('username', friendUsername)
        .single(); // single() гарантирует получение одной записи

      if (friendError || !friendUser) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Проверяем, что друг не является самим пользователем
      if (friendUser.telegram_id === telegramId) {
        return res.status(400).json({ 
          success: false,
          error: 'You cannot add yourself' 
        });
      }

      // Проверяем существование связи
      const { count, error: countError } = await supabase
        .from('friends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('friend_id', friendUser.id);

      if (countError) {
        console.error('Friendship check error:', countError);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }

      if (count && count > 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Friend already added' 
        });
      }

      // Добавляем новую дружбу
      const newFriend = {
        user_id: userId,
        friend_id: friendUser.id,
        created_at: new Date().toISOString()
      };

      await supabase.from('friends').insert([newFriend]);

      // Повторно получаем свежую запись из БД
      const { data: insertedFriend, error: selectError } = await supabase
        .from('friends')
        .select(`*, friend (*)`) // Включаем вложенные данные друга
        .eq('user_id', userId)
        .eq('friend_id', friendUser.id);

      if (selectError) {
        console.error('Select friendship error:', selectError);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }

      // Предполагаем, что result.data - это массив из одной записи
      const formattedFriend: Friend = {
        id: insertedFriend[0].id,
        created_at: insertedFriend[0].created_at,
        friend_id: insertedFriend[0].friend.id,
        friend: {
          id: insertedFriend[0].friend.id,
          first_name: insertedFriend[0].friend.first_name,
          last_name: insertedFriend[0].friend.last_name || null,
          username: insertedFriend[0].friend.username || null,
          burnout_level: insertedFriend[0].friend.burnout_level,
          coins: insertedFriend[0].friend.coins || 0,
          updated_at: insertedFriend[0].friend.updated_at
        }
      };

      return res.status(201).json({
        success: true,
        data: formattedFriend
      });
    }

    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
