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
      .single();

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
          friend_id,
          friend:friend_id (
            id, 
            first_name, 
            last_name, 
            username, 
            burnout_level,
            coins,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      // Форматируем данные для ответа
      const formattedFriends: Friend[] = (friends || []).map(f => {
        if (!f.friend || typeof f.friend.id === 'undefined') {
          throw new Error('Friend data is missing or incomplete');
            }
            return {
      id: f.id,
      created_at: f.created_at,  
      friend_id: f.friend.id,
      friend: {
      id: f.friend.id,
      first_name: f.friend.first_name,
      last_name: f.friend.last_name,
      username: f.friend.username,
      burnout_level: f.friend.burnout_level,
      coins: f.friend.coins,
      updated_at: f.friend.updated_at,
    },
  };
});
      }));

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
        .single();

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

      // Добавляем связь
      const newFriend = {
        user_id: userId,
        friend_id: friendUser.id,
        created_at: new Date().toISOString()
      };

      const { data: insertedFriend, error: insertError } = await supabase
        .from('friends')
        .insert(newFriend)
        .select(`
          id,
          created_at,
          friend_id,
          friend:friend_id (
            id, 
            first_name, 
            last_name, 
            username, 
            burnout_level,
            coins,
            updated_at
          )
        `)
        .single();

      if (insertError) {
        console.error('Insert friendship error:', insertError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to add friend' 
        });
      }

      // Форматируем ответ
      const formattedFriend: Friend = {
        id: insertedFriend.id,
        created_at: insertedFriend.created_at,
        friend_id: insertedFriend.friend_id,
        friend: {
          id: insertedFriend.friend.id,
          first_name: insertedFriend.friend.first_name,
          last_name: insertedFriend.friend.last_name || null,
          username: insertedFriend.friend.username || null,
          burnout_level: insertedFriend.friend.burnout_level,
          coins: insertedFriend.friend.coins || 0,
          updated_at: insertedFriend.friend.updated_at
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
