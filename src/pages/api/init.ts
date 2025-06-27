import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';
import { UserProfile } from '@/lib/types';
import { format } from 'date-fns';

interface InitResponse {
  success: boolean;
  user?: UserProfile;
  coinsAdded?: number;
  isNewUser?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitResponse>
) {
  console.log('[Init API] Received request', req.method, req.url);

  if (req.method !== 'POST') {
    console.warn('[Init API] Invalid method', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { initData, ref } = req.body as { initData: string; ref?: string };
    
    if (!initData) {
      console.error('[Init API] initData is required');
      return res.status(400).json({ success: false, error: 'initData required' });
    }

    if (!validateTelegramInitData(initData)) {
      console.warn('[Init API] Invalid Telegram auth data');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const telegramUser = extractTelegramUser(initData);
    if (!telegramUser?.id) {
      console.error('[Init API] User ID is missing');
      return res.status(400).json({ success: false, error: 'Invalid user data' });
    }

    const telegramId = Number(telegramUser.id);
    if (isNaN(telegramId)) {
      console.error('[Init API] Invalid Telegram ID format');
      return res.status(400).json({ success: false, error: 'Invalid Telegram ID format' });
    }

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    console.log(`[Init API] Current date: ${today}, timestamp: ${now.toISOString()}`);

    // Поиск существующего пользователя с JOIN к спрайтам
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        sprites:current_sprite_id (image_url)
      `) // Добавляем JOIN к таблице спрайтов
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (userError) {
      console.error('[Init API] Existing user fetch error:', userError);
      throw userError;
    }

    let coinsToAdd = 0;
    const isFirstLoginToday = !existingUser || existingUser.last_login_date !== today;
    
    if (isFirstLoginToday) {
      coinsToAdd = 100;
      console.log(`[Init API] Adding coins: ${coinsToAdd} for user: ${telegramId}`);
    }

    try {
      console.log(`[Init API] Upserting user: ${telegramId}`);
      
      const updates = {
        telegram_id: telegramId,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        coins: (existingUser?.coins || 0) + coinsToAdd,
        last_login_date: today,
        updated_at: now.toISOString(),
        burnout_level: existingUser?.burnout_level || 0,
        created_at: existingUser?.created_at || now.toISOString(),
        current_sprite_id: existingUser?.current_sprite_id || null // Сохраняем текущий спрайт
      };

      // Выполняем upsert без немедленного возврата данных
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(updates, {
          onConflict: 'telegram_id',
        });

      if (upsertError) throw upsertError;

      // Повторно запрашиваем пользователя с JOIN к спрайтам
      const { data: userRecord, error: selectError } = await supabase
        .from('users')
        .select(`
          *,
          sprites:current_sprite_id (image_url)
        `) // Добавляем JOIN к таблице спрайтов
        .eq('telegram_id', telegramId)
        .single();

      if (selectError) throw selectError;

      console.log('[Init API] User upsert successful:', JSON.stringify(userRecord, null, 2));

      // Обработка реферальной системы
      if (ref && typeof ref === 'string' && ref.startsWith('ref_')) {
        try {
          const cleanRef = ref.replace('ref_', '');
          const referrerTelegramId = parseInt(cleanRef, 10);
          
          if (!isNaN(referrerTelegramId) && referrerTelegramId !== telegramId) {
            console.log(`[Referral] Processing referral: ${referrerTelegramId} for user: ${telegramId}`);
            
            // Поиск реферера
            const { data: referrer, error: referrerError } = await supabase
              .from('users')
              .select('id, coins')
              .eq('telegram_id', referrerTelegramId)
              .single();

            if (referrerError) {
              console.error('[Referral] Referrer fetch error:', referrerError);
            } else if (referrer) {
              console.log(`[Referral] Referrer found: ${referrer.id}`);
              
              // Проверка существования связи
              const { count, error: friendshipError } = await supabase
                .from('friends')
                .select('*', { count: 'exact' })
                .eq('user_id', referrer.id)
                .eq('friend_id', userRecord.id);

              if (friendshipError) {
                console.error('[Referral] Friendship check error:', friendshipError);
              } else if (count === 0) {
                // Создание дружеской связи
                const { error: insertError } = await supabase
                  .from('friends')
                  .insert([{
                    user_id: referrer.id,
                    friend_id: userRecord.id,
                    status: 'accepted',
                    created_at: now.toISOString()
                  }]);
                
                if (insertError) {
                  console.error('[Referral] Insert friendship error:', insertError);
                } else {
                  console.log(`[Referral] Friendship added: ${referrer.id} -> ${userRecord.id}`);
                  
                  // Начисление бонуса рефереру
                  const { error: updateError } = await supabase
                    .from('users')
                    .update({ coins: referrer.coins + 200 })
                    .eq('id', referrer.id);
                  
                  if (updateError) {
                    console.error('[Referral] Update coins error:', updateError);
                  } else {
                    console.log(`[Referral] Added 200 coins to referrer: ${referrer.id}`);
                  }
                }
              } else {
                console.log('[Referral] Friendship already exists');
              }
            } else {
              console.log('[Referral] Referrer not found in database');
            }
          } else {
            console.log('[Referral] Invalid referrer ID or self-referral attempt');
          }
        } catch (e) {
          console.error('[Referral] Unhandled error:', e);
        }
      }

      // Формируем ответ с URL спрайта
      const responseUser: UserProfile = {
        id: userRecord.id,
        telegram_id: userRecord.telegram_id,
        created_at: userRecord.created_at,
        username: userRecord.username,
        first_name: userRecord.first_name,
        last_name: userRecord.last_name,
        burnout_level: userRecord.burnout_level,
        last_attempt_date: userRecord.last_attempt_date,
        coins: userRecord.coins,
        updated_at: userRecord.updated_at,
        current_sprite_id: userRecord.current_sprite_id,
        last_login_date: userRecord.last_login_date,
        // Добавляем URL активного спрайта
        current_sprite_url: userRecord.sprites?.image_url || null,
        character_class: userRecord.character_class
      };

      console.log('[Init API] Returning success response');
      return res.status(200).json({
        success: true,
        data: responseUser,
        coinsAdded: coinsToAdd,
        isNewUser: !existingUser
      });

    } catch (error) {
      console.error('[Init API] User upsert error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create/update user'
      });
    }

  } catch (error) {
    console.error('[Init API] Unhandled error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
}
