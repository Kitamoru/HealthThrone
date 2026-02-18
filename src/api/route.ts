import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAiInterpretation, OctalysisStats } from '@/lib/gigachat';

// Инициализируем Prisma (лучше вынести в отдельный файл lib/prisma.ts, но для примера здесь)
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Извлекаем данные из тела запроса (Telegram User ID)
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 2. Получаем данные Октализа из Supabase через Prisma
    // Используем findUnique, так как userId обычно уникален
    const userStats = await prisma.userStats.findUnique({
      where: {
        userId: BigInt(userId), // Telegram ID передается как число, в БД это BigInt
      },
    });

    if (!userStats) {
      return NextResponse.json(
        { error: 'Данные Октализа для этого игрока не найдены. Сначала пройдите тест!' },
        { status: 404 }
      );
    }

    // 3. Преобразуем данные из БД в формат, который ожидает наш сервис GigaChat
    // Убедитесь, что названия полей в БД совпадают (factor1, factor2... или приведите их здесь)
    const statsForAi: OctalysisStats = {
      factor1: userStats.factor1,
      factor2: userStats.factor2,
      factor3: userStats.factor3,
      factor4: userStats.factor4,
      factor5: userStats.factor5,
      factor6: userStats.factor6,
      factor7: userStats.factor7,
      factor8: userStats.factor8,
    };

    // 4. Запрашиваем интерпретацию у ИИ
    const advice = await getAiInterpretation(statsForAi);

    // 5. Возвращаем результат фронтенду (TWA)
    return NextResponse.json({ 
      success: true, 
      advice: advice 
    });

  } catch (error: any) {
    console.error('API Interpret Error:', error);
    
    // Обработка специфических ошибок (например, таймаут GigaChat)
    return NextResponse.json(
      { error: 'Мастер ИИ временно медитирует. Попробуйте чуть позже.', details: error.message },
      { status: 500 }
    );
  } finally {
    // Важно для serverless: отключаемся от БД, чтобы не плодить лишние коннекты
    await prisma.$disconnect();
  }
}
