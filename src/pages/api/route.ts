import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getAiInterpretation } from '@/lib/gigachat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID пользователя не предоставлен' });
    }

    if (isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    const profile = await prisma.users.findUnique({
      where: { telegram_id: BigInt(userId) },
      include: { octalysis_factors: true }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Профиль героя не найден. Сначала зарегистрируйтесь!' });
    }

    if (!profile.octalysis_factors) {
      return res.status(400).json({ error: 'Данные мотивации не найдены. Пройдите ежедневное испытание!' });
    }

    const stats = profile.octalysis_factors;
    const statsForAi = {
      factor1: Number(stats.factor1),
      factor2: Number(stats.factor2),
      factor3: Number(stats.factor3),
      factor4: Number(stats.factor4),
      factor5: Number(stats.factor5),
      factor6: Number(stats.factor6),
      factor7: Number(stats.factor7),
      factor8: Number(stats.factor8),
    };

    // Получаем класс персонажа (если отсутствует, передаём пустую строку)
    const characterClass = profile.character_class || '';

    // Вызываем функцию с двумя аргументами
    const advice = await getAiInterpretation(statsForAi, characterClass);

    if (!advice) {
      throw new Error('GigaChat вернул пустой ответ');
    }

    return res.status(200).json({ success: true, advice });
  } catch (error: any) {
    console.error('[API ERROR]', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
}
