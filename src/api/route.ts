import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAiInterpretation } from '@/lib/gigachat';

export async function POST(req: Request) {
  try {
    // 1. Проверка входящих данных
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    console.log(`[AI Advice] Запрос для userId: ${userId}`);

    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя не предоставлен' }, 
        { status: 400 }
      );
    }

    // Дополнительная проверка, что userId - число
    if (isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Некорректный ID пользователя' }, 
        { status: 400 }
      );
    }

    // 2. Поиск профиля в БД
    const profile = await prisma.users.findUnique({
      where: { telegram_id: BigInt(userId) },
      include: { octalysis_factors: true }
    });

    if (!profile) {
      console.warn(`[AI Advice] Пользователь ${userId} не найден в базе`);
      return NextResponse.json(
        { error: 'Профиль героя не найден. Сначала зарегистрируйтесь!' }, 
        { status: 404 }
      );
    }

    if (!profile.octalysis_factors) {
      console.warn(`[AI Advice] У пользователя ${userId} отсутствуют факторы Октализа`);
      return NextResponse.json(
        { error: 'Данные мотивации не найдены. Пройдите ежедневное испытание!' }, 
        { status: 400 }
      );
    }

    // 3. Подготовка данных для GigaChat
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

    console.log(`[AI Advice] Отправка факторов в GigaChat для ${userId}...`);

    // 4. Запрос к ИИ
    const advice = await getAiInterpretation(statsForAi);

    if (!advice) {
      throw new Error('GigaChat вернул пустой ответ');
    }

    console.log(`[AI Advice] Совет успешно сгенерирован для ${userId}`);

    // 5. Успешный ответ
    return NextResponse.json({ 
      success: true,
      advice: advice 
    });

  } catch (error: any) {
    console.error('[AI Advice CRITICAL ERROR]:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка сервера при получении совета', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}
