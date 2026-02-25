
// src/lib/octalysis.ts

export interface OctalysisStats {
  factor1: number; // Эпическая значимость
  factor2: number; // Творчество и обратная связь
  factor3: number; // Социальное влияние
  factor4: number; // Непредсказуемость
  factor5: number; // Избегание потерь
  factor6: number; // Дефицит и нетерпение
  factor7: number; // Обладание и владение
  factor8: number; // Достижения
}

export interface NormalizedStats {
  factor1: number; // в процентах от суммы (0-100)
  factor2: number;
  factor3: number;
  factor4: number;
  factor5: number;
  factor6: number;
  factor7: number;
  factor8: number;
}

export type Archetype = 'Достигатор' | 'Исследователь' | 'Социализатор' | 'Завоеватель';

export type ProfileMaturity = 'nascent' | 'emerging' | 'developed' | 'mature';

export interface Insights {
  // Базовые метрики
  avg: number;
  max: number;
  min: number;
  
  // Нормализованные значения
  normalized: NormalizedStats;
  totalScore: number;
  profileMaturity: ProfileMaturity;
  
  // Доминирующие и отстающие факторы
  dominantFactors: Array<{ 
    key: string; 
    value: number; 
    label: string; 
    percentage: number 
  }>;
  laggingFactors: Array<{ 
    key: string; 
    value: number; 
    label: string; 
    percentage: number 
  }>;
  
  // Турбулентность (коэффициент вариации)
  turbulenceScore: number;
  
  // Группы мотивации (в процентах)
  whiteHatPercentage: number;
  blackHatPercentage: number;
  amplifierPercentage: number;
  
  whiteHatDominant: boolean;
  blackHatDominant: boolean;
  
  // Риск выгорания
  burnoutRisk: 'low' | 'moderate' | 'high' | 'critical';
  
  // Архетип
  determinedArchetype: Archetype;
  
  // Базовые психологические потребности (SDT)
  autonomy: number;
  competence: number;
  relatedness: number;
  
  // Поведенческие сигналы
  isolationRisk: boolean;
  hoardingRisk: boolean;
  harmony: boolean;
  polarization: boolean;
  
  // Динамика изменений
  changes?: Record<string, number>;
}

const FACTOR_LABELS: Record<keyof OctalysisStats, string> = {
  factor1: 'Эпическая значимость',
  factor2: 'Творчество и обратная связь',
  factor3: 'Социальное влияние',
  factor4: 'Непредсказуемость',
  factor5: 'Избегание потерь',
  factor6: 'Дефицит и нетерпение',
  factor7: 'Обладание и владение',
  factor8: 'Достижения',
};

/**
 * Нормализует профиль к процентам (сумма = 100%)
 */
function normalizeProfile(stats: OctalysisStats): NormalizedStats {
  const sum = Object.values(stats).reduce((a, b) => a + b, 0);
  
  // Если сумма = 0, возвращаем равномерное распределение
  if (sum === 0) {
    return {
      factor1: 12.5, factor2: 12.5, factor3: 12.5, factor4: 12.5,
      factor5: 12.5, factor6: 12.5, factor7: 12.5, factor8: 12.5,
    };
  }
  
  return {
    factor1: (stats.factor1 / sum) * 100,
    factor2: (stats.factor2 / sum) * 100,
    factor3: (stats.factor3 / sum) * 100,
    factor4: (stats.factor4 / sum) * 100,
    factor5: (stats.factor5 / sum) * 100,
    factor6: (stats.factor6 / sum) * 100,
    factor7: (stats.factor7 / sum) * 100,
    factor8: (stats.factor8 / sum) * 100,
  };
}

/**
 * Определяет "зрелость" профиля игрока
 */
function assessProfileMaturity(totalScore: number): ProfileMaturity {
  if (totalScore < 40) return 'nascent';      // новичок, только начал
  if (totalScore < 100) return 'emerging';    // заполняет профиль
  if (totalScore < 160) return 'developed';   // активный игрок
  return 'mature';                            // опытный игрок
}

/**
 * Рассчитывает турбулентность через коэффициент вариации (CV)
 * CV = (стандартное отклонение / среднее) * 100
 * 0-20% = низкая, 20-40% = средняя, 40%+ = высокая
 */
function calculateTurbulence(values: number[], avg: number): number {
  if (avg === 0) return 0;
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;
  
  return Math.round(cv);
}

/**
 * Глубинный анализ показателей Октализа
 */
export function computeInsights(
  stats: OctalysisStats,
  previousStats?: OctalysisStats
): Insights {
  const values = Object.values(stats);
  const totalScore = values.reduce((a, b) => a + b, 0);
  const avg = totalScore / values.length;
  
  // Нормализация
  const normalized = normalizeProfile(stats);
  const normalizedValues = Object.values(normalized);
  const normalizedAvg = 12.5; // для 8 факторов
  
  // Зрелость профиля
  const profileMaturity = assessProfileMaturity(totalScore);
  
  // Турбулентность (относительная)
  const turbulenceScore = calculateTurbulence(values, avg);
  
  // Доминирующие и отстающие факторы (с процентами)
  const labeled = (Object.keys(stats) as Array<keyof OctalysisStats>).map((key, index) => ({
    key,
    value: stats[key],
    label: FACTOR_LABELS[key],
    percentage: normalizedValues[index],
  }));
  
  const dominantFactors = labeled
    .filter((f) => f.percentage > normalizedAvg * 1.2) // > 15%
    .sort((a, b) => b.percentage - a.percentage);
  
  const laggingFactors = labeled
    .filter((f) => f.percentage < normalizedAvg * 0.6) // < 7.5%
    .sort((a, b) => a.percentage - b.percentage);
  
  // Группировка по "Шляпам" (в процентах)
  const whiteHatPercentage = normalized.factor1 + normalized.factor2 + normalized.factor3;
  const blackHatPercentage = normalized.factor4 + normalized.factor5 + normalized.factor6;
  const amplifierPercentage = normalized.factor7 + normalized.factor8;
  
  const whiteHatDominant = whiteHatPercentage > blackHatPercentage * 1.3; // на 30%+ больше
  const blackHatDominant = blackHatPercentage > whiteHatPercentage * 1.3;
  
  // Риск выгорания (динамические пороги в зависимости от зрелости)
  let burnoutRisk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  
  if (profileMaturity === 'nascent') {
    // Для новичков более мягкие критерии
    if (blackHatPercentage > 55) burnoutRisk = 'critical';
    else if (blackHatPercentage > 45) burnoutRisk = 'high';
    else if (blackHatPercentage > 40) burnoutRisk = 'moderate';
  } else if (profileMaturity === 'emerging') {
    if (blackHatPercentage > 50) burnoutRisk = 'critical';
    else if (blackHatPercentage > 42) burnoutRisk = 'high';
    else if (blackHatPercentage > 38) burnoutRisk = 'moderate';
  } else {
    // Для опытных игроков - строже
    if (blackHatPercentage > 45) burnoutRisk = 'critical';
    else if (blackHatPercentage > 40) burnoutRisk = 'high';
    else if (blackHatPercentage > 35) burnoutRisk = 'moderate';
  }
  
  // Определение архетипа (по нормализованным значениям)
  let determinedArchetype: Archetype = 'Достигатор';
  const topFactors = dominantFactors.slice(0, 2).map((f) => f.key);
  
  if (topFactors.includes('factor2') || topFactors.includes('factor4')) {
    determinedArchetype = 'Исследователь';
  } else if (topFactors.includes('factor3') || topFactors.includes('factor1')) {
    determinedArchetype = 'Социализатор';
  } else if (topFactors.includes('factor5') || topFactors.includes('factor6')) {
    determinedArchetype = 'Завоеватель';
  }
  
  // Базовые психологические потребности (в процентах)
  const autonomy = (normalized.factor1 + normalized.factor2) / 2;
  const competence = (normalized.factor8 + normalized.factor2) / 2;
  const relatedness = normalized.factor3;
  
  // Поведенческие сигналы (относительные пороги)
  const isolationRisk = normalized.factor3 < normalizedAvg * 0.5; // < 6.25%
  const hoardingRisk = normalized.factor7 > normalizedAvg * 2; // > 25%
  
  // Гармония: все факторы в пределах ±30% от среднего
  const harmony = normalizedValues.every((v) => Math.abs(v - normalizedAvg) <= normalizedAvg * 0.3);
  
  // Поляризация: хотя бы один фактор > 25%, и хотя бы 4 фактора < 10%
  const polarization = 
    normalizedValues.some((v) => v > 25) && 
    normalizedValues.filter((v) => v < 10).length >= 4;
  
  // Динамика изменений
  const changes = previousStats
    ? (() => {
        const delta: Record<string, number> = {};
        (Object.keys(stats) as Array<keyof OctalysisStats>).forEach((key) => {
          delta[key] = stats[key] - previousStats[key];
        });
        return delta;
      })()
    : undefined;
  
  return {
    avg,
    max: Math.max(...values),
    min: Math.min(...values),
    normalized,
    totalScore,
    profileMaturity,
    dominantFactors,
    laggingFactors,
    turbulenceScore,
    whiteHatPercentage,
    blackHatPercentage,
    amplifierPercentage,
    whiteHatDominant,
    blackHatDominant,
    burnoutRisk,
    determinedArchetype,
    autonomy,
    competence,
    relatedness,
    isolationRisk,
    hoardingRisk,
    harmony,
    polarization,
    changes,
  };
}

/**
 * Преобразует инсайты в психологическую сводку для системного промпта AI
 */
export function buildAIAnalysisContext(
  insights: Insights,
  className: string,
  archetypeFromClass: string,
  userContext?: string
): string {
  const lines: string[] = [];
  
  // 1. Идентичность
  const identityMatch = insights.determinedArchetype === archetypeFromClass
    ? `идёт своим путём как **${archetypeFromClass}**`
    : `носит имя **${archetypeFromClass}**, но сейчас душа его ближе к **${insights.determinedArchetype}**`;
  
  lines.push(`Перед тобой герой класса **${className}**, который ${identityMatch}.`);
  
  // 2. Стадия пути
  const maturityDescriptions: Record<ProfileMaturity, string> = {
    nascent: 'только начинает свой путь, ещё не определился с направлением',
    emerging: 'активно познаёт себя, формирует свой стиль',
    developed: 'уже знает свои сильные стороны, но всё ещё растёт',
    mature: 'опытный странник с чётким компасом'
  };
  lines.push(`Стадия пути: ${maturityDescriptions[insights.profileMaturity]}.`);
  
  // 3. Драйверы (через метафору + проценты)
  const mainDrivers = insights.dominantFactors.slice(0, 2);
  if (mainDrivers.length > 0) {
    const driverImages: Record<string, string> = {
      'factor1': 'горит огонь смысла',
      'factor2': 'бьёт ключом творческая жилка',
      'factor3': 'теплятся нити связи с миром',
      'factor4': 'кружит голову жажда новизны',
      'factor5': 'давит груз страха потерь',
      'factor6': 'торопит чувство ускользающего времени',
      'factor7': 'крепка хватка владения',
      'factor8': 'пылает жажда побед'
    };
    
    const descriptions = mainDrivers.map(f => 
      `${driverImages[f.key] || f.label} (${Math.round(f.percentage)}% души)`
    ).join(', ');
    
    lines.push(`Сейчас в душе его ${descriptions}.`);
  }
  
  // 4. Состояние — через эмоциональный ландшафт
  lines.push('');
  
  const burnoutMessages: Record<typeof insights.burnoutRisk, string> = {
    critical: `**ВИДИШЬ ЛИ ТЫ ЭТО:** Герой на грани. Тёмная энергия (страх, спешка, давление) составляет ${Math.round(insights.blackHatPercentage)}% от всей его мотивации, при том что светлая (смысл, творчество, связь) — только ${Math.round(insights.whiteHatPercentage)}%. Это как корабль, идущий только на парусах бури. Твоя задача — не вдохновлять, а *укрыть*. Дай передышку.`,
    
    high: `**ВИДИШЬ ЛИ ТЫ ЭТО:** Тревожный дисбаланс. Тёмная энергия (${Math.round(insights.blackHatPercentage)}%) значительно превышает светлую (${Math.round(insights.whiteHatPercentage)}%). Мотивация держится на тревоге. Квесты должны мягко переключить с "бежать от" на "идти к".`,
    
    moderate: `**ВИДИШЬ ЛИ ТЫ ЭТО:** Баланс под вопросом. Тёмная энергия (${Math.round(insights.blackHatPercentage)}%) начинает перевешивать светлую (${Math.round(insights.whiteHatPercentage)}%). Будь внимателен: герой ещё держится, но напряжение растёт.`,
    
    low: `**ВИДИШЬ ЛИ ТЫ ЭТО:** Здоровый баланс. Светлая энергия (${Math.round(insights.whiteHatPercentage)}%) ведёт за собой. Можешь смело бросить вызов — герой готов расти.`
  };
  
  lines.push(burnoutMessages[insights.burnoutRisk]);
  
  // 5. Турбулентность
  if (insights.turbulenceScore > 40) {
    lines.push('');
    lines.push(`**СИГНАЛ ШТОРМА:** Внутренний разброс очень высок (${insights.turbulenceScore}% вариативность). Герой мечется между крайностями — это признак поиска или потерянности. Помоги найти якорь.`);
  } else if (insights.turbulenceScore < 20 && insights.profileMaturity !== 'nascent') {
    lines.push('');
    lines.push(`**СИГНАЛ ЗАСТОЯ:** Все факторы почти одинаковы. Возможно, герой в рутине или играет осторожно. Подтолкни к эксперименту.`);
  }
  
  // 6. Скрытые боли
  const pains: string[] = [];
  if (insights.autonomy < 10) pains.push("чувствует себя марионеткой (нет контроля над своими действиями)");
  if (insights.competence < 10) pains.push("сомневается в своём мастерстве");
  if (insights.relatedness < 8) pains.push("тоскует по социальным связям");
  
  if (pains.length > 0) {
    lines.push('');
    lines.push(`**СКРЫТЫЕ БОЛИ (не называй их вслух):** ${pains.join('; ')}.`);
  }
  
  // 7. Поведенческие маркеры
  const signals: string[] = [];
  if (insights.isolationRisk) signals.push("Одинокий маяк (социальная связь < 6%)");
  if (insights.hoardingRisk) signals.push("Ловушка дракона (накопление > 25%)");
  if (insights.harmony) signals.push("Гармоничный профиль — редкий дар");
  if (insights.polarization) signals.push("Поляризация — одна сила затмевает все");
  
  if (signals.length > 0) {
    lines.push('');
    lines.push(`**СИГНАЛЫ:** ${signals.join('. ')}.`);
  }
  
  // 8. Динамика
  if (insights.changes) {
    const significant = Object.entries(insights.changes)
      .filter(([_, d]) => Math.abs(d) >= 5)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    
    if (significant.length > 0) {
      lines.push('');
      lines.push(`**ДВИЖЕНИЕ ДУШИ (если есть):**`);
      significant.forEach(([key, delta]) => {
        const name = FACTOR_LABELS[key as keyof OctalysisStats] || key;
        const trend = delta > 0 ? `выросла` : `угасла`;
        const strength = Math.abs(delta) > 10 ? 'резко' : '';
        lines.push(`- ${name} ${strength} ${trend}`);
      });
    }
  }
  
  // 9. Стратегия
  lines.push('');
  lines.push(`**ТВОЯ СТРАТЕГИЯ:**`);
  
  if (insights.burnoutRisk === 'critical') {
    lines.push(`- НЕ предлагай достижений и челленджей`);
    lines.push(`- Квесты: на отдых, смысл, возвращение к себе`);
    lines.push(`- Тон: обволакивающий, как тёплый плед`);
    lines.push(`- Метафоры: тихая гавань, костёр, передышка`);
  } else if (insights.burnoutRisk === 'high') {
    lines.push(`- Мягко переключай с "бегства от" на "движение к"`);
    lines.push(`- Квесты: малые победы без ставок, эксперименты`);
    lines.push(`- Тон: поддерживающий, партнёрский`);
  } else if (insights.burnoutRisk === 'moderate') {
    lines.push(`- Балансируй вызов и поддержку`);
    lines.push(`- Квесты: на восстановление баланса, не на подвиг`);
    lines.push(`- Тон: внимательный, заботливый`);
  } else if (insights.polarization) {
    lines.push(`- Подсвети красоту других направлений`);
    lines.push(`- Квесты: на развитие отстающих факторов, но без "надо"`);
    lines.push(`- Тон: приглашение в новое, а не упрёк в старом`);
  } else if (insights.harmony) {
    lines.push(`- Поддержи эту гармонию, но не дай заскучать`);
    lines.push(`- Квесты: на углубление, мастерство, передачу знаний`);
    lines.push(`- Тон: равный к равному`);
  } else {
    lines.push(`- Брось вызов — герой готов`);
    lines.push(`- Квесты: на рост в доминирующих факторах`);
    lines.push(`- Тон: воодушевляющий, эпичный`);
  }
  
  // 10. Рекомендации по квестам
  const questFocus: string[] = [];
  const questRecommendations: Record<string, string> = {
    'factor1': 'один квест на смысл (зачем это всё?)',
    'factor2': 'один квест на творчество (сделай что-то просто так)',
    'factor3': 'один квест на связь (живой контакт с человеком)',
    'factor4': 'один квест на новизну (попробуй неизвестное)',
    'factor5': 'один квест на принятие неопределённости',
    'factor6': 'один квест на замедление (дай себе время)',
    'factor7': 'один квест на отпускание (что можно не копить?)',
    'factor8': 'один квест на малую победу (что можно завершить прямо сейчас?)'
  };
  
  insights.laggingFactors.slice(0, 2).forEach(f => {
    if (questRecommendations[f.key]) {
      questFocus.push(questRecommendations[f.key]);
    }
  });
  
  if (questFocus.length > 0) {
    lines.push('');
    lines.push(`**НАПРАВЛЕНИЯ ДЛЯ КВЕСТОВ:** ${questFocus.join('; ')}.`);
  }
  
  // 11. Контекст от игрока
  if (userContext) {
    lines.push('');
    lines.push(`**СЛОВА ГЕРОЯ:** "${userContext}"`);
    lines.push('(Вплети их в свой ответ, если они дают ключ к пониманию игрока)');
  }
  
  return lines.join('\n');
}
