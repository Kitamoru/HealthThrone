import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { format } from 'date-fns';

const verifyTelegramData = (initData: string): boolean => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) return false;
    params.delete('hash');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TOKEN!)
      .digest();

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hash === calculatedHash;
  } catch (err) {
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData, ref } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData required' });
    }

    if (!verifyTelegramData(initData)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    const user_id = user?.id;

    if (!user_id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const now = new Date().toISOString();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Проверяем существующего пользователя
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, coins, last_login_date, created_at')
      .eq('telegram_id', user_id)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    let coinsToAdd = 0;
    const isFirstLoginToday = !existingUser || existingUser.last_login_date !== today;
    
    // Начисляем 100 монет за первый вход сегодня
    if (isFirstLoginToday) {
      coinsToAdd = 100;
    }

    try {
      const updates = {
        telegram_id: user_id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        coins: (existingUser?.coins || 0) + coinsToAdd,
        last_login_date: today,
        updated_at: now
      };

      const { data: userData, error: upsertError } = await supabase
        .from('users')
        .upsert(updates, {
          onConflict: 'telegram_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      // Обработка реферальной ссылки
      if (ref && typeof ref === 'string') {
        try {
          const cleanRef = ref.replace('ref_', '');
          const referrerTelegramId = parseInt(cleanRef, 10);
          
          if (!isNaN(referrerTelegramId) && referrerTelegramId !== user_id) {
            const { data: referrer, error: referrerError } = await supabase
              .from('users')
              .select('id')
              .eq('telegram_id', referrerTelegramId)
              .single();

            if (!referrerError && referrer) {
              const { data: existingFriendship, error: friendshipError } = await supabase
                .from('friends')
                .select('id')
                .eq('user_id', referrer.id)
                .eq('friend_id', userData.id);

              if (!friendshipError && (!existingFriendship || existingFriendship.length === 0)) {
                await supabase
                  .from('friends')
                  .insert([{
                    user_id: referrer.id,
                    friend_id: userData.id,
                    status: 'accepted',
                    created_at: now
                  }]);
              }
            }
          }
        } catch (e) {
          console.error('Referral error:', e);
        }
      }

      return res.status(200).json({
        success: true,
        user: userData,
        coinsAdded: coinsToAdd,
        isNewUser: !existingUser
      });

    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to create/update user',
        details: error instanceof Error ? error.message : String(error)
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
