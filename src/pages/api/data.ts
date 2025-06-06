import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Получаем данные пользователя и его купленные спрайты
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        user_sprites (sprite_id)
      `)
      .eq('telegram_id', userIdNumber)
      .single();

    if (error) {
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Формируем массив ID купленных спрайтов
    const purchased_sprites = user.user_sprites?.map((us: any) => us.sprite_id) || [];

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        purchased_sprites
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
