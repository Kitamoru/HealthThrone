import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { validateInitData } from '../../../lib/telegramAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const valid = validateInitData(initData);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid init data' });
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end('Method Not Allowed');
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { userId } = req.body;

  if (!id || !userId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', Number(id))
      .eq('user_id', Number(userId));

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
