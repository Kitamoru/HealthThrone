import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = extractUserFromInitData(initData);
  if (!user?.id) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  if (req.method === 'DELETE') {
    const friendId = parseInt(req.query.id as string, 10);
    
    if (isNaN(friendId)) {
      return res.status(400).json({ error: 'Invalid friend ID' });
    }

    try {
      // Проверяем, что друг принадлежит пользователю
      const { data: friend, error: fetchError } = await supabase
        .from('friends')
        .select('id')
        .eq('id', friendId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!friend) {
        return res.status(404).json({ error: 'Friend not found' });
      }

      // Удаляем друга
      const { error: deleteError } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      if (deleteError) throw deleteError;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete friend' });
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
