import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateInitData } from '../../../lib/telegramAuth';
import { Friend } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const valid = validateInitData(initData);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid init data' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  try {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', Number(userId));

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { userId, friendTelegramId, friendUsername } = req.body;

  if (!userId || !friendTelegramId || !friendUsername) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Проверяем, не добавлен ли уже этот друг
    const { data: existing, error: existingError } = await supabase
      .from('friends')
      .select()
      .eq('user_id', userId)
      .eq('friend_telegram_id', friendTelegramId);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Friend already added' });
    }

    // Добавляем нового друга
    const { data: newFriend, error: insertError } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_telegram_id: friendTelegramId,
        friend_username: friendUsername,
        friend_burnout_level: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(newFriend);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
