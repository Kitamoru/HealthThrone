import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';

interface OwnedResponse {
  success: boolean;
  data?: number[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OwnedResponse>
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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const queryTelegramId = req.query.telegramId as string;
  if (!queryTelegramId) {
    return res.status(400).json({ success: false, error: 'telegramId required' });
  }

  const queryTelegramIdNum = parseInt(queryTelegramId, 10);
  if (isNaN(queryTelegramIdNum)) {
    return res.status(400).json({ success: false, error: 'Invalid telegramId format' });
  }

  // Проверяем, что запрашиваемый telegramId совпадает с авторизованным
  if (queryTelegramIdNum !== telegramId) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    // Находим внутренний ID пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Получаем список купленных спрайтов
    const { data: userSprites, error: dbError } = await supabase
      .from('user_sprites')
      .select('sprite_id')
      .eq('user_id', userData.id);

    if (dbError) {
      throw dbError;
    }

    const spriteIds = userSprites?.map(item => item.sprite_id) || [];
    return res.status(200).json({ success: true, data: spriteIds });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
