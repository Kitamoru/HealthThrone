import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAiInterpretation } from '@/lib/gigachat';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json(); // Это ID из Telegram

    if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 });

    // Ищем профиль и сразу подтягиваем факторы
    const profile = await prisma.users.findUnique({
      where: { telegram_id: BigInt(userId) },
      include: { octalysis_factors: true }
    });

    if (!profile || !profile.octalysis_factors) {
      return NextResponse.json({ error: 'Данные Октализа не найдены' }, { status: 404 });
    }

    const stats = profile.octalysis_factors;

    // Мапим для ИИ (превращаем в числа)
    const statsForAi = {
      factor1: stats.factor1, factor2: stats.factor2,
      factor3: stats.factor3, factor4: stats.factor4,
      factor5: stats.factor5, factor6: stats.factor6,
      factor7: stats.factor7, factor8: stats.factor8,
    };

    const advice = await getAiInterpretation(statsForAi);

    return NextResponse.json({ advice });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера', details: error.message }, { status: 500 });
  }
}
