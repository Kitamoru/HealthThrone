import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

console.log("[Data API] Initializing data API handler");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Data API] Received request', req.method, req.url);
  
  // Заголовки для предотвращения кеширования
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'GET') {
    console.warn('[Data API] Invalid method', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка авторизации через initData
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    console.warn('[Data API] Unauthorized: Invalid or missing init data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Безопасное извлечение параметра
    let telegramId = req.query.telegramId;
    
    // Обработка массива значений
    if (Array.isArray(telegramId)) {
      telegramId = telegramId[0];
    }

    console.log('[Data API] Request query:', req.query);

    if (!telegramId) {
      console.error('[Data API] telegramId is required');
      return res.status(400).json({ error: 'telegramId required' });
    }

    // Преобразование в число и валидация
    const telegramIdNumber = parseInt(telegramId, 10);
    if (isNaN(telegramIdNumber)) {
      console.error('[Data API] Invalid telegramId format:', telegramId);
      return res.status(400).json({ error: 'Invalid telegramId format' });
    }

    console.log(`[Data API] Fetching user data for ID: ${telegramIdNumber}`);
    
    // Установка контекста пользователя для RLS
    await supabase.rpc('set_current_user', { user_id: telegramIdNumber.toString() });

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramIdNumber)
      .single();

    if (error) {
      console.error('[Data API] Database error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message
      });
    }

    if (!user) {
      console.error('[Data API] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Data API] User data found:', JSON.stringify({
      id: user.id,
      telegram_id: user.telegram_id,
      burnout_level: user.burnout_level,
      last_attempt_date: user.last_attempt_date
    }, null, 2));
    
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        telegram_id: user.telegram_id,
        created_at: user.created_at,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        burnout_level: user.burnout_level || 0,
        last_attempt_date: user.last_attempt_date,
        coins: user.coins || 0,
        updated_at: user.updated_at,
        current_sprite_id: user.current_sprite_id,
        last_login_date: user.last_login_date
      }
    });

  } catch (error: any) {
    console.error('[Data API] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || String(error)
    });
  }
}
