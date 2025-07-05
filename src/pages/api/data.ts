import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';
import { UserProfile } from '@/lib/types';

interface DataResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DataResponse>
) {
  console.log('[Data API] Received request', req.method, req.url);

  // Усиленные заголовки против кеширования
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    console.warn('[Data API] Invalid method', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Проверка авторизации через initData
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    console.warn('[Data API] Unauthorized: Invalid or missing init data');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Извлекаем telegramId из query-параметров
    const telegramId = req.query.telegramId as string;

    console.log('[Data API] Raw telegramId:', telegramId);

    if (!telegramId) {
      console.error('[Data API] telegramId is required');
      return res.status(400).json({ success: false, error: 'telegramId required' });
    }

    // Преобразуем telegramId в число
    const telegramIdNumber = Number(telegramId);
    if (isNaN(telegramIdNumber)) {
      console.error('[Data API] Invalid telegramId format:', telegramId);
      return res.status(400).json({ success: false, error: 'Invalid telegramId format' });
    }

    // Дополнительная проверка пользователя из initData
    const telegramUser = extractTelegramUser(initData);
    if (!telegramUser) {
      console.warn('[Data API] Failed to extract Telegram user');
      return res.status(400).json({ success: false, error: 'Invalid user data' });
    }

    const userTelegramId = Number(telegramUser.id);
    if (isNaN(userTelegramId)) {
      console.warn('[Data API] Invalid Telegram user ID');
      return res.status(400).json({ success: false, error: 'Invalid Telegram ID' });
    }

    // Проверка соответствия ID в запросе и авторизации
    if (userTelegramId !== telegramIdNumber) {
      console.warn(
        `[Data API] User ID mismatch: auth=${userTelegramId}, request=${telegramIdNumber}`
      );
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    console.log(`[Data API] Fetching user data for ID: ${telegramIdNumber}`);

    // Запрашиваем данные пользователя из базы данных
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select(`
        *,
        sprites:current_sprite_id (image_url)
      `)
      .eq('telegram_id', telegramIdNumber)
      .single();

    if (dbError) {
      console.error('[Data API] Database error:', dbError);
      
      // Проверяем, является ли ошибка отсутствием пользователя
      if (dbError.code === 'PGRST116') { // Код "Resource not found"
        return res.status(404).json({ 
          success: false,
          error: 'User not found. Please complete initialization first.'
        });
      }
      
      return res.status(500).json({ 
        success: false,
        error: 'Database error'
      });
    }

    // Формируем данные пользователя для ответа
    const userData: UserProfile = {
      id: user.id,
      telegram_id: user.telegram_id,
      created_at: user.created_at,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      burnout_level: user.burnout_level,
      last_attempt_date: user.last_attempt_date,
      coins: user.coins,
      updated_at: user.updated_at,
      current_sprite_id: user.current_sprite_id,
      last_login_date: user.last_login_date,
      current_sprite_url: user.sprites?.image_url || null,
      character_class: user.character_class
    };

    console.log('[Data API] Successfully fetched user profile');
    return res.status(200).json({
      success: true,
      data: userData
    });

  } catch (error: any) {
    console.error('[Data API] Unhandled error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
}
