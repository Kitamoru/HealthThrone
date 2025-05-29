import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  { auth: { persistSession: false } }
);

const verifyTelegramData = (initData: string): boolean => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TOKEN!)
      .digest();

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    return hash === calculatedHash;
  } catch (err) {
    console.error('Telegram hash verification failed:', err);
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
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData required' });
    }

    if (!verifyTelegramData(initData)) {
      console.warn('Invalid Telegram auth data');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    const user_id = user?.id; // Объявлена здесь

    if (!user_id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Проверяем существование пользователя
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database fetch error:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    let userData;

    if (existingUser) {
      // Обновляем данные
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          first_name: user.first_name,
          last_name: user.last_name || null,
          username: user.username || null,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', user_id)
        .select()
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      userData = updatedUser;
    } else {
      // Создаем нового пользователя
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: user_id,
          first_name: user.first_name,
          last_name: user.last_name || null,
          username: user.username || null,
          burnout_level: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('User creation error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      userData = newUser;
    }

    // Возвращаем успешный ответ
    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
