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
  
  // Логируем входящий хедер с x-telegram-init-data
  console.log(`Received X-Telegram-Init-Data header: ${initData}`);

  if (!initData || !validateTelegramInitData(initData)) {
    console.error("API request rejected due to invalid or missing Telegram initialization data");
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Извлекаем пользователя Telegram
  const telegramUser = extractTelegramUser(initData);
  if (!telegramUser?.id) {
    console.error("Failed to extract valid Telegram user data");
    return res.status(400).json({ success: false, error: 'Invalid user data' });
  }

  const telegramId = Number(telegramUser.id);
  if (isNaN(telegramId)) {
    console.error("Invalid Telegram ID format received");
    return res.status(400).json({ success: false, error: 'Invalid Telegram ID format' });
  }

  if (req.method !== 'GET') {
    console.error(`Unsupported HTTP method used: ${req.method}. Only GET is supported.`);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Логируем попытку поиска пользователя
    console.log(`Attempting to find internal user with Telegram ID: ${telegramId}`);
    
    // Находим внутреннего пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !userData) {
      console.error(`[Owned API] User lookup failed for Telegram ID ${telegramId}:`, userError || 'User not found');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Логируем найденного пользователя
    console.log(`Found internal user with ID: ${userData.id}`);

    // Получаем список купленных спрайтов
    const { data: userSprites, error: dbError } = await supabase
      .from('user_sprites')
      .select('sprite_id')
      .eq('user_id', userData.id);

    if (dbError) {
      console.error(`Database error fetching sprites for user ${userData.id}`, dbError);
      throw dbError;
    }

    const spriteIds = userSprites?.map((item) => item.sprite_id) || [];

    // Логируем успешно полученные спрайты
    console.log(`Fetched sprite IDs for user ${userData.id}:`, spriteIds);

    return res.status(200).json({ success: true, data: spriteIds });
  } catch (error) {
    console.error('Error processing request:', error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
