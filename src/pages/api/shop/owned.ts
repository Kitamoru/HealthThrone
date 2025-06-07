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

  const telegramId = req.query.telegramId as string;
  console.log('[Shop/Owned] telegramId from query:', telegramId);
  
  if (!telegramId) {
    console.log('[Shop/Owned] Bad request: telegramId is required');
    return res.status(400).json({ error: 'telegramId required' });
  }

  try {
    const telegramIdNumber = parseInt(telegramId, 10);
    console.log('[Shop/Owned] Parsed telegramIdNumber:', telegramIdNumber);
    
    if (isNaN(telegramIdNumber)) {
      console.log('[Shop/Owned] Bad request: telegramId is not a number', telegramId);
      return res.status(400).json({ error: 'Invalid telegramId format' });
    }

    // Устанавливаем контекст пользователя для RLS
    await setUserContext(user.id);
    console.log('[Shop/Owned] User context set for Telegram user:', user.id);

    // Получаем список купленных спрайтов
    const { data: userData, error: userError } = await supabase
  .from('users')
  .select('id')
  .eq('telegram_id', telegramId)
  .single();

if (userError || !userData) {
  throw new Error('User not found');
}

// Затем получаем спрайты по user_id
const { data, error: dbError } = await supabase
  .from('user_sprites')
  .select('sprite_id')
  .eq('user_id', userData.id);

    console.log(`[Shop/Owned] Retrieved ${data?.length} sprites for user ${telegramIdNumber}`);
    
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
