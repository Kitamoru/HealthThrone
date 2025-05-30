import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Инициализация Supabase с сервисным ключом
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // Используем сервисный ключ
  { auth: { persistSession: false } }
);

// Улучшенная проверка данных Telegram
const verifyTelegramData = (initData: string): boolean => {
  try {
    console.log('Verifying Telegram data...');
    
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      console.error('Hash not found in initData');
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
    
    console.log('Telegram hash verification result:', isValid);
    return isValid;
  } catch (err) {
    console.error('Telegram hash verification failed:', err);
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Received init request');
  
  if (req.method !== 'POST') {
    console.warn('Invalid method', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!initData) {
      console.error('initData is required');
      return res.status(400).json({ error: 'initData required' });
    }

    if (!verifyTelegramData(initData)) {
      console.warn('Invalid Telegram auth data');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    const user_id = user?.id;

    console.log('Parsed user data:', user);

    if (!user_id) {
      console.error('User ID is missing');
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Проверяем существование пользователя
    console.log('Checking user in database...');
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user_id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database fetch error:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    let userData;
    const now = new Date().toISOString();

    if (existingUser) {
      console.log('User exists, updating...');
      // Обновляем данные
      const updateData = {
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        photo_url: user.photo_url || null,
        updated_at: now
      };

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('telegram_id', user_id)
        .select()
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      userData = updatedUser;
      console.log('User updated:', updatedUser);
    } else {
      console.log('User not found, creating new...');
      // Создаем нового пользователя
      const insertData = {
        telegram_id: user_id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        photo_url: user.photo_url || null,
        burnout_level: 0,
        created_at: now,
        updated_at: now
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('User creation error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      userData = newUser;
      console.log('User created:', newUser);
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
