import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';
import { format } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const initData = req.headers['x-telegram-init-data'] as string;
  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegramId } = req.body;
  if (!telegramId) {
    return res.status(400).json({ error: 'telegramId is required' });
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // Получаем текущие данные пользователя
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('burnout_level, last_attempt_date')
      .eq('telegram_id', telegramId)
      .single();

    if (fetchError) throw fetchError;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Обновляем только если сегодня еще не было попытки
    if (user.last_attempt_date !== today) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_attempt_date: today })
        .eq('telegram_id', telegramId);

      if (updateError) throw updateError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to update attempt date:', error);
    return res.status(500).json({ error: 'Failed to update attempt date' });
  }
}
