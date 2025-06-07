import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, parseInitData } from '@/lib/telegramAuth';
import { setUserContext } from '@/lib/supabase';

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

  // Парсим initData для получения user
  const initDataParsed = parseInitData(initData);
  const user = initDataParsed.user;
  if (!user || !user.id) {
    console.log('[Shop/Owned] Unauthorized: user not found in init data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    console.log(`[Shop/Owned] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Обработка userId с учетом возможного массива значений
  const rawUserId = req.query.userId;
  let userId: string | number | undefined;
  
  if (Array.isArray(rawUserId)) {
    userId = rawUserId[0]; // Берем первое значение если это массив
  } else {
    userId = rawUserId;
  }

  console.log('[Shop/Owned] userId from query:', userId);
  
  if (!userId) {
    console.log('[Shop/Owned] Bad request: userId is required');
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Добавленная проверка типа
    let userIdNumber: number;
    if (typeof userId === 'number') {
      userIdNumber = userId;
    } else {
      userIdNumber = parseInt(userId, 10);
    }
    
    console.log('[Shop/Owned] Parsed userIdNumber:', userIdNumber);
    
    if (isNaN(userIdNumber)) {
      console.log('[Shop/Owned] Bad request: userId is not a number', userId);
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Устанавливаем контекст пользователя для RLS
    await setUserContext(user.id);
    console.log('[Shop/Owned] User context set for Telegram user:', user.id);

    // Получаем список купленных спрайтов
    const { data, error: dbError } = await supabase
      .from('user_sprites')
      .select('sprite_id')
      .eq('user_id', userIdNumber);

    if (dbError) {
      console.error('[Shop/Owned] Database error:', dbError);
      throw dbError;
    }

    console.log(`[Shop/Owned] Retrieved ${data?.length} sprites for user ${userIdNumber}`);
    
    // Преобразуем в массив ID, проверяя на null
    const spriteIds = data ? data.map(item => item.sprite_id) : [];
    return res.status(200).json({ success: true, data: spriteIds });
  } catch (error) {
    console.error('[Shop/Owned] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch owned sprites',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
