import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Shop/Owned] Request received. Method:', req.method);

  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    console.log('[Shop/Owned] Unauthorized: missing or invalid init data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Парсинг initData для получения ID пользователя
  const params = new URLSearchParams(initData);
  const userString = params.get('user');
  if (!userString) {
    console.log('[Shop/Owned] Unauthorized: user not found in init data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let telegramUser;
  try {
    telegramUser = JSON.parse(userString);
  } catch (e) {
    console.log('[Shop/Owned] Unauthorized: failed to parse user data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!telegramUser || !telegramUser.id) {
    console.log('[Shop/Owned] Unauthorized: user not found in init data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    console.log(`[Shop/Owned] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const telegramId = req.query.telegramId as string;
  console.log('[Shop/Owned] telegramId from query:', telegramId);
  
  if (!telegramId) {
    console.log('[Shop/Owned] Bad request: telegramId is required');
    return res.status(400).json({ error: 'telegramId required' });
  }

  try {
    const telegramId = req.query.telegramId as string;
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId required' });
    }

    const telegramIdNumber = parseInt(telegramId, 10);
    if (isNaN(telegramIdNumber)) {
      return res.status(400).json({ error: 'Invalid telegramId format' });
    }


    // Установка контекста пользователя для RLS
    await supabase.rpc('set_current_user', { user_id: telegramIdNumber.toString() });
    console.log('[Shop/Owned] User context set for Telegram user:', telegramIdNumber);

    // Получаем внутренний ID пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramIdNumber)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    // Получаем список купленных спрайтов
    const { data, error: dbError } = await supabase
      .from('user_sprites')
      .select('sprite_id')
      .eq('user_id', userData.id);

    if (dbError) {
      console.error('[Shop/Owned] Database error:', dbError);
      throw dbError;
    }

    console.log(`[Shop/Owned] Retrieved ${data?.length} sprites for user ${telegramIdNumber}`);
    
     const spriteIds = data ? data.map(item => item.sprite_id) : [];
    return res.status(200).json({ success: true, data: spriteIds });
  } catch (error) {
    console.error('[Shop/Owned] Error:', error);
    // При ошибке возвращаем пустой массив
    return res.status(200).json({ 
      success: true, 
      data: [] 
    });
  }
}
