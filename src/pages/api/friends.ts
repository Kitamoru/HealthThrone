import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../src/lib/supabase';
import { validateInitData } from './_middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверка аутентификации
  const initData = req.headers['initdata'] as string;
  if (!validateInitData(initData)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing user ID' });
  }

  try {
    const { data, error } = await supabase
      .from('friends')
      .select('friend_id, friend_username, burnout_level')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.status(200).json({ 
      success: true, 
      data: data.map(f => ({
        id: f.friend_id,
        username: f.friend_username,
        burnout_level: f.burnout_level
      })) 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { userId, friendId, friendUsername } = req.body;

  if (!userId || !friendId || !friendUsername) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  try {
    // Проверяем, не добавлен ли уже этот друг
    const { data: existing, error: existingError } = await supabase
      .from('friends')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    if (existingError) throw existingError;
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Friend already added' });
    }

    // Добавляем друга
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        friend_username: friendUsername,
        burnout_level: 0
      });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { userId, friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
