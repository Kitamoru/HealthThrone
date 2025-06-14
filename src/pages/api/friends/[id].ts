import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const telegramUser = extractTelegramUser(initData);
  if (!telegramUser?.id) {
    return res.status(400).json({ success: false, error: 'Invalid user data' });
  }

  const telegramId = Number(telegramUser.id);
  if (isNaN(telegramId)) {
    return res.status(400).json({ success: false, error: 'Invalid Telegram ID' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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
        error: 'User not found' 
      });
    }
    
    const userId = currentUser.id;
    const friendId = parseInt(req.query.id as string, 10);
    
    if (isNaN(friendId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid friend ID' 
      });
    }

    // Удаляем друга
    const { error: deleteError } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendId)
      .eq('user_id', userId);

    if (deleteError) {
      return res.status(500).json({ 
        success: false,
        error: 'Delete failed' 
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
}
