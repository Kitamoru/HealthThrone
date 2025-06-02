import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Генерация уникального кода (6 символов)
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Сохранение в базе
  const { error } = await supabase
    .from('invites')
    .insert({ 
      code: inviteCode, 
      created_by: userId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
    });

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  // Формирование ссылки для приглашения
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';
  const inviteLink = `${appUrl}/friends?invite=${inviteCode}`;

  res.status(200).json({ success: true, link: inviteLink });
}
