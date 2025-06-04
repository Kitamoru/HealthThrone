import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

console.log("[Init API] Initializing init API handler");

const verifyTelegramData = (initData: string): boolean => {
  console.log("[Init API] Verifying Telegram data");

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      console.error('[Init API] Hash not found in initData');
      return false;
    }
    params.delete('hash');

    // Создаем секрет как указано в документации Telegram
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TOKEN!)
      .digest();

    // Сортируем параметры по алфавиту
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = hash === calculatedHash;
    console.log(`[Init API] Telegram hash verification result: ${isValid}`);
    return isValid;
  } catch (err) {
    console.error('[Init API] Telegram hash verification failed:', err);
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Init API] Received request', req.method, req.url);

  if (req.method !== 'POST') {
    console.warn('[Init API] Invalid method', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData, ref } = req.body;
    console.log('[Init API] Request body:', JSON.stringify(req.body, null, 2));

    if (!initData) {
      console.error('[Init API] initData is required');
      return res.status(400).json({ error: 'initData required' });
    }

    if (!verifyTelegramData(initData)) {
      console.warn('[Init API] Invalid Telegram auth data');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    const user_id = user?.id;

    // Упрощенное логирование без photo_url
    console.log('[Init API] Parsed user data:', JSON.stringify({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username
    }, null, 2));

    if (!user_id) {
      console.error('[Init API] User ID is missing');
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Проверяем существование пользователя
    console.log(`[Init API] Checking user in database: ${user_id}`);
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user_id)
      .maybeSingle();

    if (fetchError) {
      console.error('[Init API] Database fetch error:', fetchError);
      return res.status(500).json({ 
        error: 'Database error',
        details: fetchError.message
      });
    }

    let userData;
    const now = new Date().toISOString();
    console.log(`[Init API] Current timestamp: ${now}`);

    // Флаг для определения нового пользователя
    let isNewUser = false;

    if (existingUser) {
      console.log('[Init API] User exists, updating...');
      // Обновляем данные БЕЗ photo_url
      const updateData = {
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        updated_at: now
      };

      console.log('[Init API] Update data:', JSON.stringify(updateData, null, 2));

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('telegram_id', user_id)
        .select()
        .single();

      if (updateError) {
        console.error('[Init API] User update error:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update user',
          details: updateError.message
        });
      }

      userData = updatedUser;
      console.log('[Init API] User updated:', JSON.stringify(updatedUser, null, 2));
    } else {
      isNewUser = true;
      console.log('[Init API] User not found, creating new...');
      // Создаем нового пользователя БЕЗ photo_url
      const insertData = {
        telegram_id: user_id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        burnout_level: 0,
        created_at: now,
        updated_at: now
      };

      console.log('[Init API] Insert data:', JSON.stringify(insertData, null, 2));

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('[Init API] User creation error:', insertError);
        return res.status(500).json({ 
          error: 'Failed to create user',
          details: insertError.message
        });
      }

      userData = newUser;
      console.log('[Init API] User created:', JSON.stringify(newUser, null, 2));
    }

   // Обработка реферальной ссылки
if (ref && typeof ref === 'string') {
  try {
    // Удаляем возможный префикс (если есть)
    const cleanRef = ref.replace('ref_', '');
    const referrerTelegramId = parseInt(cleanRef, 10);
    
    if (!isNaN(referrerTelegramId)) {
      console.log(`[Referral] Processing referral: ${referrerTelegramId} for user: ${user_id}`);
      
      // Проверяем что пользователь не добавляет сам себя
      if (referrerTelegramId === user_id) {
        console.log('[Referral] User tried to add themselves, skipping');
      } else {
        // Проверяем существует ли реферер
        const { data: referrer, error: referrerError } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', referrerTelegramId)
          .single();

        if (referrerError) {
          console.error('[Referral] Referrer fetch error:', referrerError);
        } else if (referrer) {
          console.log(`[Referral] Referrer found: ${referrer.id}`);
          
          // Проверяем нет ли уже связи
          const { data: existingFriendship, error: friendshipError } = await supabase
            .from('friends')
            .select('id')
            .eq('user_id', referrer.id)
            .eq('friend_id', userData.id);

          if (friendshipError) {
            console.error('[Referral] Friendship check error:', friendshipError);
          } else if (!existingFriendship || existingFriendship.length === 0) {
            // Добавляем запись
            const { error: insertError } = await supabase
              .from('friends')
              .insert([{
                user_id: referrer.id,
                friend_id: userData.id,
                status: 'accepted',
                created_at: new Date().toISOString()
              }]);
            
            if (insertError) {
              console.error('[Referral] Insert friendship error:', insertError);
            } else {
              console.log(`[Referral] Friendship added: ${referrer.id} -> ${userData.id}`);
            }
          } else {
            console.log('[Referral] Friendship already exists');
          }
        } else {
          console.log('[Referral] Referrer not found in database');
        }
      }
    }
  } catch (e) {
    console.error('[Referral] Unhandled error:', e);
  }
}

    console.log('[Init API] Returning success response');
    return res.status(200).json({
      success: true,
      user: userData,
      isNewUser
    });
 
  } catch (error) {
    console.error('[Init API] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
