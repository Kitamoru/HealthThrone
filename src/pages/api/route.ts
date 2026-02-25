import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { computeInsights, insightsToPromptText } from '@/lib/octalysis';
import { getAiInterpretation } from '@/lib/groq';

// Маппинг классов на архетипы.
// Важно: значения должны совпадать с типом Archetype из octalysis.ts
// ('Достигатор' | 'Исследователь' | 'Социализатор' | 'Завоеватель')
// чтобы archetypeMatches в computeInsights работал корректно.
const CLASS_ARCHETYPES: Record<string, string> = {
  // Разработчик
  'Мастер алгоритмов':      'Достигатор',
  'Искатель оптимизации':   'Исследователь',
  'Бард коллаборации':      'Социализатор',
  'Разрушитель багов':      'Завоеватель',

  // Инженер по безопасности
  'Страж уязвимостей':      'Достигатор',
  'Шпион угроз':            'Исследователь',
  'Проповедник безопасности': 'Социализатор',
  'Охотник за угрозами':    'Завоеватель',

  // Тестер
  'Мастер покрытия':        'Достигатор',
  'Ловец багов':            'Исследователь',
  'Посол качества':         'Социализатор',
  'Испытатель пределов':    'Завоеватель',

  // Аналитик
  'Заклинатель метрик':     'Достигатор',
  'Алхимик данных':         'Исследователь',
  'Рассказчик инсайтов':    'Социализатор',
  'Разрушитель иллюзий':    'Завоеватель',

  // Дизайнер
  'Ясновидящий':            'Достигатор',
  'Картограф опыта':        'Исследователь',
  'Глас народа':            'Социализатор',
  'Разрушитель хаоса':      'Завоеватель',

  // Продакт менеджер
  'Завоеватель рынков':     'Достигатор',
  'Провидец рынка':         'Исследователь',
  'Миротворец стейкхолдеров': 'Социализатор',
  'Балансир спринтов':      'Завоеватель',

  // Менеджер проектов
  'Мастер дедлайнов':       'Достигатор',
  'Навигатор хаоса':        'Исследователь',
  'Дирижер команды':        'Социализатор',
  'Разрушитель преград':    'Завоеватель',

  // Скрам мастер
  'Хранитель скорости':     'Достигатор',
  'Призыватель кайдзенов':  'Исследователь',
  'Мастер церемоний':       'Социализатор',
  'Охотник на импедансы':   'Завоеватель',

  // Тимлид
  'Архитектор роста':       'Достигатор',
  'Навигатор развития':     'Исследователь',
  'Наставник гильдии':      'Социализатор',
  'Щит команды':            'Завоеватель',

  // Техлид
  'Архимаг качества':       'Достигатор',
  'Проводник технологий':   'Исследователь',
  'Мудрец кода':            'Социализатор',
  'Судья техдолга':         'Завоеватель',

  // Саппорт
  'Волшебник поддержки':    'Достигатор',
  'Хранитель истины':       'Исследователь',
  'Посол доверия':          'Социализатор',
  'Охотник за SLA':         'Завоеватель',

  // Девопс
  'Страж стабильности':     'Достигатор',
  'Алхимик инфраструктуры': 'Исследователь',
  'Говорящий с духами':     'Социализатор',
  'Укротитель инцидентов':  'Завоеватель',

  // Архитектор
  'Мудрец систем':          'Достигатор',
  'Советник будущего':      'Исследователь',
  'Проповедник смыслов':    'Социализатор',
  'Искатель антипаттернов': 'Завоеватель',

  // Аккаунт менеджер
  'Зачарователь сделок':    'Достигатор',
  'Картограф потребностей': 'Исследователь',
  'Повелитель отношений':   'Социализатор',
  'Охотник за возражениями': 'Завоеватель',

  // Менеджер по продажам
  'Торговец судьбы':        'Достигатор',
  'Коллекционер путей':     'Исследователь',
  'Хранитель связей':       'Социализатор',
  'Повелитель желаний':     'Завоеватель',

  // C-level
  'Повелитель ресурсов':    'Достигатор',
  'Провидец':               'Исследователь',
  'Связующий звезды':       'Социализатор',
  'Убийца стагнации':       'Завоеватель',

  // HR
  'Инженер талантов':       'Достигатор',
  'Картограф мотивации':    'Исследователь',
  'Изгнанник выгорания':    'Социализатор',
  'Охотник за головами':    'Завоеватель',
};

function getClassArchetype(className: string): string {
  return CLASS_ARCHETYPES[className] ?? 'Достигатор';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userContext } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID пользователя не предоставлен' });
    }

    if (isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    const profile = await prisma.users.findUnique({
      where: { telegram_id: BigInt(userId) },
      include: { octalysis_factors: true },
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

    const className = profile.character_class || '';
    const archetype = getClassArchetype(className);

    // 1. Математика — octalysis.ts считает всё детерминированно
    const insights = computeInsights(statsForAi, archetype, previousStatsForAi);
    // 2. Готовый текст с директивами для агента
    const analysisContext = insightsToPromptText(insights, archetype);
    // 3. Передаём в groq.ts — только интерпретация и промпт
    const advice = await getAiInterpretation(
      analysisContext,
      className,
      archetype,
      userContext,
    );

    if (!advice) {
      throw new Error('Groq вернул пустой ответ');
    }

    return res.status(200).json({ success: true, advice });
  } catch (error: any) {
    console.error('[API ERROR]', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
}
