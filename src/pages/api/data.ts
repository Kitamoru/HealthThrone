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

  // Заголовки для предотвращения кеширования
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

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
    if (!telegramUser || Number(telegramUser.id) !== telegramIdNumber) {
      console.warn('[Data API] User ID mismatch');
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    console.log(`[Data API] Fetching user data for ID: ${telegramIdNumber}`);

    // Запрашиваем данные пользователя из базы данных с JOIN к спрайтам и факторам
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select(`
        *,
        sprites:current_sprite_id (image_url),
        factors:octalysis_factors (factor1, factor2, factor3, factor4, factor5, factor6, factor7, factor8)
      `)
      .eq('telegram_id', telegramIdNumber)
      .single();

    if (dbError) {
      console.error('[Data API] Database error:', dbError);
      return res.status(500).json({ 
        success: false,
        error: 'Database error'
      });
    }

    // Формируем данные пользователя для ответа
    const userData: UserProfile = {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      burnout_level: user.burnout_level,
      last_attempt_date: user.last_attempt_date,
      coins: user.coins,
      current_sprite_id: user.current_sprite_id,
      current_sprite_url: user.sprites?.image_url || null,
      octalysis_factors: user.factors ? [
        user.factors.factor1,
        user.factors.factor2,
        user.factors.factor3,
        user.factors.factor4,
        user.factors.factor5,
        user.factors.factor6,
        user.factors.factor7,
        user.factors.factor8
      ] : [50, 50, 50, 50, 50, 50, 50, 50],
      // Добавляем обязательные поля
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    console.log('[Data API] User profile loaded successfully');

    // Возвращаем сформированный профиль пользователя
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
