import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegramAuth';
import { Sprite } from '@/lib/types';

interface SpritesResponse {
  success: boolean;
  data?: Sprite[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpritesResponse>
) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData || !validateTelegramInitData(initData)) {
    return res.status(401).json({ 
      success: false, 
      error: 'Неавторизованный запрос' 
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Метод не разрешен' 
    });
  }

  try {
    const { data, error } = await supabase
      .from('sprites')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;

    // Валидация типа данных
    const isValid = Array.isArray(data) && data.every(item => 
      typeof item.id === 'number' && 
      typeof item.name === 'string'
    );

    if (!isValid) {
      throw new Error('Некорректный формат данных спрайтов');
    }

    return res.status(200).json({ 
      success: true, 
      data: data as Sprite[] 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return res.status(500).json({
      success: false,
      error: `Ошибка сервера: ${message}`
    });
  }
}
