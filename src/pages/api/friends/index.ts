import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';
import { Friend, UserProfile } from '@/lib/types';

// Модифицированные интерфейсы с добавлением поля message
interface FriendsResponse {
  success: boolean;
  data?: Friend[];
  error?: string;
  message?: string; // Новое поле
}

interface AddFriendResponse {
  success: boolean;
  data?: Friend;
  error?: string;
  message?: string; // Новое поле
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
      const { data: rawFriends, error } = await supabase
        .from('friends')
        .select('id, created_at, friend_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }

      // Массив для хранения итоговых данных
      const formattedFriends: Friend[] = [];

      for (let i = 0; i < rawFriends.length; i++) {
        const friendRecord = rawFriends[i];
        
        // Отдельно запрашиваем профиль друга
        const { data: friendData, error: friendError } = await supabase
          .from('users')
          .select('id, first_name, last_name, username, burnout_level, coins, updated_at')
          .eq('id', friendRecord.friend_id)
          .single();

        if (friendError || !friendData) {
          continue; // Пропускаем данную запись, если возникли ошибки
        }

        formattedFriends.push({
          id: friendRecord.id,
          created_at: friendRecord.created_at,
          friend_id: friendRecord.friend_id,
          friend: {
            id: friendData.id,
            first_name: friendData.first_name,
            last_name: friendData.last_name || null,
            username: friendData.username || null,
            burnout_level: friendData.burnout_level,
            coins: friendData.coins || 0,
            updated_at: friendData.updated_at
          }
        });
      }

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

      // Добавляем новую дружбу и получаем данные обратно
      const { data: insertedFriend, error: insertError } = await supabase
        .from('friends')
        .insert([{ user_id: userId, friend_id: friendUser.id, created_at: new Date().toISOString(), status: 'active' }])
        .select('*'); // Возвращаем все поля новой записи

      if (insertError || !insertedFriend || insertedFriend.length === 0) {
        return res.status(500).json({ success: false, error: 'Could not create a new friend record' });
      }

      // Используем новую запись с полем id
      const newFriend = insertedFriend[0];

      // Дополнительно запрашиваем профиль нового друга
      const { data: friendDetails, error: detailError } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, burnout_level, coins, updated_at')
        .eq('id', newFriend.friend_id)
        .single();

      if (detailError || !friendDetails) {
        return res.status(500).json({ success: false, error: 'Could not retrieve friend details' });
      }

      // Формируем ответ
      return res.status(201).json({
        success: true,
        message: 'Friend successfully added',
        data: {
          id: newFriend.id, // Теперь доступно поле id
          created_at: newFriend.created_at,
          friend_id: newFriend.friend_id,
          friend: {
            id: friendDetails.id,
            first_name: friendDetails.first_name,
            last_name: friendDetails.last_name || null,
            username: friendDetails.username || null,
            burnout_level: friendDetails.burnout_level,
            coins: friendDetails.coins || 0,
            updated_at: friendDetails.updated_at
          }
        }
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
