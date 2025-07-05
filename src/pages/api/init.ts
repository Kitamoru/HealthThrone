import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData, extractTelegramUser } from '@/lib/telegramAuth';
import { UserProfile, ApiResponse } from '@/lib/types';
import { format, utcToZonedTime } from 'date-fns-tz';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<UserProfile>>
) {
  console.log('[Init API] Received request', req.method, req.url);

  if (req.method !== 'POST') {
    console.warn('[Init API] Invalid method', req.method);
    return res.status(405).json({ 
      success: false, 
      status: 405,
      error: 'Method not allowed' 
    });
  }

  try {
    const { initData, ref } = req.body as { initData: string; ref?: string };
    
    if (!initData) {
      console.error('[Init API] initData is required');
      return res.status(400).json({ 
        success: false, 
        status: 400,
        error: 'initData required' 
      });
    }

    if (!validateTelegramInitData(initData)) {
      console.warn('[Init API] Invalid Telegram auth data');
      return res.status(401).json({ 
        success: false, 
        status: 401,
        error: 'Unauthorized' 
      });
    }

    const telegramUser = extractTelegramUser(initData);
    if (!telegramUser?.id) {
      console.error('[Init API] User ID is missing');
      return res.status(400).json({ 
        success: false, 
        status: 400,
        error: 'Invalid user data' 
      });
    }

    const telegramId = Number(telegramUser.id);
    if (isNaN(telegramId)) {
      console.error('[Init API] Invalid Telegram ID format');
      return res.status(400).json({ 
        success: false, 
        status: 400,
        error: 'Invalid Telegram ID format' 
      });
    }

    // Исправлено: использование UTC для корректного определения дня
    const now = new Date();
    const utcDate = utcToZonedTime(now, 'UTC');
    const today = format(utcDate, 'yyyy-MM-dd');
    console.log(`[Init API] Current UTC date: ${today}`);

    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        sprites:current_sprite_id (image_url)
      `)
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
        burnout_level: existingUser?.burnout_level || 100,
        created_at: existingUser?.created_at || now.toISOString(),
        current_sprite_id: existingUser?.current_sprite_id || null,
        character_class: existingUser?.character_class || null
      };

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(updates, {
          onConflict: 'telegram_id',
        });

      if (upsertError) throw upsertError;

      // Исправлено: всегда получаем обновленные данные после upsert
      const { data: updatedUser, error: selectError } = await supabase
        .from('users')
        .select(`
          *,
          sprites:current_sprite_id (image_url)
        `)
        .eq('telegram_id', telegramId)
        .single();

      if (selectError) throw selectError;

      console.log('[Init API] User upsert successful:', JSON.stringify(updatedUser, null, 2));

      // Обработка реферальной системы
      if (ref && typeof ref === 'string' && ref.startsWith('ref_')) {
        try {
          // Безопасное извлечение реферера
          const cleanRef = ref.replace('ref_', '');
          const referrerTelegramId = parseInt(cleanRef, 10);
          
          if (!isNaN(referrerTelegramId) {
            // Проверка на самоссылку
            if (referrerTelegramId === telegramId) {
              console.log('[Referral] Self-referral attempt blocked');
            } else {
              console.log(`[Referral] Processing referral: ${referrerTelegramId} for user: ${telegramId}`);
              
              // Атомарное обновление баланса реферера
              const { error: referralError } = await supabase.rpc('handle_referral', {
                new_user_id: updatedUser.id,
                referrer_tg_id: referrerTelegramId,
                bonus_amount: 200
              });

              if (referralError) {
                console.error('[Referral] Referral processing error:', referralError);
              } else {
                console.log('[Referral] Referral processed successfully');
              }
            }
          } else {
            console.log('[Referral] Invalid referrer ID format');
          }
        } catch (e) {
          console.error('[Referral] Unhandled error:', e);
        }
      }

      const responseUser: UserProfile = {
        id: updatedUser.id,
        telegram_id: updatedUser.telegram_id,
        created_at: updatedUser.created_at,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        burnout_level: updatedUser.burnout_level,
        last_attempt_date: updatedUser.last_attempt_date,
        coins: updatedUser.coins,
        updated_at: updatedUser.updated_at,
        current_sprite_id: updatedUser.current_sprite_id,
        last_login_date: updatedUser.last_login_date,
        current_sprite_url: updatedUser.sprites?.image_url || null,
        character_class: updatedUser.character_class
      };

      console.log('[Init API] Returning success response');
      return res.status(200).json({
        success: true,
        status: 200,
        data: responseUser
      });

    } catch (error) {
      console.error('[Init API] User upsert error:', error);
      return res.status(500).json({ 
        success: false,
        status: 500,
        error: 'Failed to create/update user'
      });
    }

  } catch (error) {
    console.error('[Init API] Unhandled error:', error);
    return res.status(500).json({ 
      success: false,
      status: 500,
      error: 'Internal server error'
    });
  }
}
