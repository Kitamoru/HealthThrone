import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase; // Используем существующий клиент
import { setUserContext } from '../../lib/supabase; // Используем существующую функцию RLS

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Проверка метода
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Извлечение данных
  const { telegram_id, character_class } = req.body;
  
  // 3. Валидация
  if (!telegram_id || !character_class) {
    return res.status(400).json({ 
      error: 'Missing required fields: telegram_id or character_class' 
    });
  }

  try {
    // 4. Установка контекста пользователя для RLS
    await setUserContext(telegram_id);
    console.log(`[Onboarding] Setting context for user: ${telegram_id}`);

    // 5. Обновление данных в Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ character_class })
      .eq('telegram_id', telegram_id)
      .select(); // Добавляем select для возврата обновленных данных

    // 6. Обработка ошибок Supabase
    if (error) {
      console.error('[Supabase] Update error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({ 
        error: 'Database update failed',
        details: error.message 
      });
    }

    // 7. Проверка результата
    if (!data || data.length === 0) {
      console.warn(`[Onboarding] No user found with telegram_id: ${telegram_id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // 8. Успешный ответ
    console.log(`[Onboarding] Updated class for ${telegram_id} to ${character_class}`);
    return res.status(200).json({ 
      success: true, 
      updatedUser: data[0] 
    });
    
  } catch (err) {
    // 9. Обработка непредвиденных ошибок
    console.error('[Onboarding] Internal server error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
