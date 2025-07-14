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

  // Получаем внутренний ID пользователя
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', user.id)
    .single();

  if (userError || !currentUser) {
    return res.status(500).json({ success: false, error: 'User not found in database' });
  }
  const userId = currentUser.id;

  if (req.method === 'GET') {
    try {
      // Получаем друзей с актуальными данными из users и их спрайтами
      const { data: friends, error } = await supabase
        .from('friends')
        .select(`
          id, 
          created_at,
          friend:friend_id (
            id, 
            first_name, 
            last_name, 
            username, 
            burnout_level,
            current_sprite_id,
            character_class,
            sprites:current_sprite_id (image_url)
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Возвращаем данные в ожидаемой структуре
      return res.status(200).json({ 
        success: true, 
        data: friends 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }
  }

  if (req.method === 'POST') {
    const { friendUsername } = req.body;

    if (!friendUsername) {
      return res.status(400).json({ 
        success: false, 
        error: 'Friend username is required' 
      });
    }

    try {
      // Находим пользователя по username
      const { data: friendUser, error: friendError } = await supabase
        .from('users')
        .select('id')
        .eq('username', friendUsername)
        .single();

      if (friendError || !friendUser) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Проверяем, что друг не является самим пользователем
      if (friendUser.id === userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'You cannot add yourself' 
        });
      }

      // Проверяем существование связи
      const { count } = await supabase
        .from('friends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('friend_id', friendUser.id);

      if (count && count > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Friend already added' 
        });
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
      
      return res.status(201).json({ 
        success: true, 
        data: newFriend 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to add friend' 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
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
