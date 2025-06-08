import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

console.log("[Data API] Initializing data API handler");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Data API] Received request', req.method, req.url, req.query);
  
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
    // Извлекаем telegramId из query параметров
    const telegramId = req.query.telegramId;
    
    console.log('[Data API] Raw telegramId:', telegramId);

    if (!telegramId) {
      console.error('[Data API] telegramId is required');
      return res.status(400).json({ error: 'telegramId required' });
    }

    // Преобразование в число
    const telegramIdNumber = Number(telegramId);
    if (isNaN(telegramIdNumber)) {
      console.error('[Data API] Invalid telegramId format:', telegramId);
      return res.status(400).json({ error: 'Invalid telegramId format' });
    }

    console.log(`[Data API] Fetching user data for ID: ${telegramIdNumber}`);
    
    // Установка контекста пользователя для RLS
    const setUserResult = await supabase.rpc('set_current_user', { 
      user_id: telegramIdNumber.toString() 
    });

    if (setUserResult.error) {
      console.error('[Data API] RLS error:', setUserResult.error);
      return res.status(500).json({ 
        error: 'RLS configuration failed',
        details: setUserResult.error.message
      });
    }

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

    // Если пользователь не найден, создаем default структуру
    if (!user) {
      console.error('[Data API] User not found, returning default');
      
      const defaultUserData = {
        id: 0,
        telegram_id: telegramIdNumber,
        created_at: new Date().toISOString(),
        username: null,
        first_name: null,
        last_name: null,
        burnout_level: 0,
        last_attempt_date: null,
        coins: 0,
        updated_at: new Date().toISOString(),
        current_sprite_id: null,
        last_login_date: null
      };
      
      console.log('[Data API] Default user data:', JSON.stringify(defaultUserData, null, 2));
      
      return res.status(200).json({
        success: true,
        data: defaultUserData
      });
    }

    // Формируем данные пользователя для ответа
    const userData = {
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
    };

    console.log('[Data API] Full user data:', JSON.stringify(userData, null, 2));
    
    return res.status(200).json({
      success: true,
      data: userData
    });

  } catch (error: any) {
    console.error('[Data API] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || String(error)
    });
  }
}
