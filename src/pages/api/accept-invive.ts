import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, inviteCode } = req.body;

  if (!userId || !inviteCode) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // Проверяем инвайт
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('code', inviteCode)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError || !invite) {
    return res.status(400).json({ error: 'Invalid or expired invite code' });
  }

  // Получаем данные приглашающего
  const { data: inviter, error: inviterError } = await supabase
    .from('users')
    .select('id, telegram_id, username, burnout_level')
    .eq('id', invite.created_by)
    .single();

  if (inviterError || !inviter) {
    return res.status(400).json({ error: 'Inviter not found' });
  }

  // Получаем данные текущего пользователя
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id, telegram_id, username, burnout_level')
    .eq('id', userId)
    .single();

  if (userError || !currentUser) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Проверяем, не пытается ли пользователь добавить сам себя
  if (inviter.id === currentUser.id) {
    return res.status(400).json({ error: "You can't add yourself" });
  }

  // Проверяем, не добавлен ли уже этот друг
  const { data: existingFriend, error: friendError } = await supabase
    .from('friends')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('friend_telegram_id', inviter.telegram_id)
    .single();

  if (!friendError && existingFriend) {
    return res.status(400).json({ error: 'This user is already your friend' });
  }

  // Создаем запись о друге
  const { error: createError } = await supabase
    .from('friends')
    .insert({
      user_id: currentUser.id,
      friend_telegram_id: inviter.telegram_id,
      friend_username: inviter.username || `user_${inviter.telegram_id}`,
      friend_burnout_level: inviter.burnout_level || 0
    });

  if (createError) {
    console.error('Create friend error:', createError);
    return res.status(500).json({ error: 'Failed to create friendship' });
  }

  // Удаляем использованный инвайт
  await supabase
    .from('invites')
    .delete()
    .eq('id', invite.id);

  res.status(200).json({ success: true });
}
