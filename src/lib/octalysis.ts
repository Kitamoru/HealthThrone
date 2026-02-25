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
  factor1: number;
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
export type BurnoutRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface Insights {
  avg: number;
  max: number;
  min: number;
  normalized: NormalizedStats;
  totalScore: number;
  profileMaturity: ProfileMaturity;
  dominantFactors: Array<{ key: string; value: number; label: string; percentage: number }>;
  laggingFactors: Array<{ key: string; value: number; label: string; percentage: number }>;
  turbulenceScore: number;
  whiteHatPercentage: number;
  blackHatPercentage: number;
  amplifierPercentage: number;
  whiteHatDominant: boolean;
  blackHatDominant: boolean;
  burnoutRisk: BurnoutRisk;
  determinedArchetype: Archetype;
  autonomy: number;
  competence: number;
  relatedness: number;
  isolationRisk: boolean;
  hoardingRisk: boolean;
  harmony: boolean;
  polarization: boolean;
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
 * Вспомогательные функции расчета
 */
function normalizeProfile(stats: OctalysisStats): NormalizedStats {
  const sum = Object.values(stats).reduce((a, b) => a + b, 0);
  if (sum === 0) return { factor1: 12.5, factor2: 12.5, factor3: 12.5, factor4: 12.5, factor5: 12.5, factor6: 12.5, factor7: 12.5, factor8: 12.5 };
  
  const res: any = {};
  (Object.keys(stats) as Array<keyof OctalysisStats>).forEach(key => {
    res[key] = (stats[key] / sum) * 100;
  });
  return res as NormalizedStats;
}

function assessProfileMaturity(totalScore: number): ProfileMaturity {
  if (totalScore < 40) return 'nascent';
  if (totalScore < 100) return 'emerging';
  if (totalScore < 160) return 'developed';
  return 'mature';
}

function calculateTurbulence(values: number[], avg: number): number {
  if (avg === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.round((Math.sqrt(variance) / avg) * 100);
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ ВЫЧИСЛЕНИЙ
 */
export function computeInsights(stats: OctalysisStats, previousStats?: OctalysisStats): Insights {
  const values = Object.values(stats);
  const totalScore = values.reduce((a, b) => a + b, 0);
  const avg = totalScore / values.length;
  const normalized = normalizeProfile(stats);
  const normalizedValues = Object.values(normalized);
  const profileMaturity = assessProfileMaturity(totalScore);
  const turbulenceScore = calculateTurbulence(values, avg);

  const labeled = (Object.keys(stats) as Array<keyof OctalysisStats>).map((key) => ({
    key,
    value: stats[key],
    label: FACTOR_LABELS[key],
    percentage: normalized[key],
  }));

  const dominantFactors = labeled.filter(f => f.percentage > 15).sort((a, b) => b.percentage - a.percentage);
  const laggingFactors = labeled.filter(f => f.percentage < 7.5).sort((a, b) => a.percentage - b.percentage);

  const whiteHatPercentage = normalized.factor1 + normalized.factor2 + normalized.factor3;
  const blackHatPercentage = normalized.factor4 + normalized.factor5 + normalized.factor6;
  const amplifierPercentage = normalized.factor7 + normalized.factor8;

  const whiteHatDominant = whiteHatPercentage > blackHatPercentage * 1.3;
  const blackHatDominant = blackHatPercentage > whiteHatPercentage * 1.3;

  // Расчет BurnoutRisk
  let burnoutRisk: BurnoutRisk = 'low';
  const bh = blackHatPercentage;
  if (profileMaturity === 'nascent') {
    if (bh > 55) burnoutRisk = 'critical'; else if (bh > 45) burnoutRisk = 'high'; else if (bh > 40) burnoutRisk = 'moderate';
  } else if (profileMaturity === 'emerging') {
    if (bh > 50) burnoutRisk = 'critical'; else if (bh > 42) burnoutRisk = 'high'; else if (bh > 38) burnoutRisk = 'moderate';
  } else {
    if (bh > 45) burnoutRisk = 'critical'; else if (bh > 40) burnoutRisk = 'high'; else if (bh > 35) burnoutRisk = 'moderate';
  }

  // Архетип
  let determinedArchetype: Archetype = 'Достигатор';
  const topKeys = dominantFactors.slice(0, 2).map(f => f.key);
  if (topKeys.includes('factor2') || topKeys.includes('factor4')) determinedArchetype = 'Исследователь';
  else if (topKeys.includes('factor3') || topKeys.includes('factor1')) determinedArchetype = 'Социализатор';
  else if (topKeys.includes('factor5') || topKeys.includes('factor6')) determinedArchetype = 'Завоеватель';

  return {
    avg, totalScore, profileMaturity, dominantFactors, laggingFactors, turbulenceScore,
    normalized, whiteHatPercentage, blackHatPercentage, amplifierPercentage,
    whiteHatDominant, blackHatDominant, burnoutRisk, determinedArchetype,
    max: Math.max(...values), min: Math.min(...values),
    autonomy: (normalized.factor1 + normalized.factor2) / 2,
    competence: (normalized.factor8 + normalized.factor2) / 2,
    relatedness: normalized.factor3,
    isolationRisk: normalized.factor3 < 6.25,
    hoardingRisk: normalized.factor7 > 25,
    harmony: normalizedValues.every(v => Math.abs(v - 12.5) <= 3.75),
    polarization: normalizedValues.some(v => v > 25) && normalizedValues.filter(v => v < 10).length >= 4,
    changes: previousStats ? (() => {
      const delta: any = {};
      (Object.keys(stats) as Array<keyof OctalysisStats>).forEach(k => delta[k] = stats[k] - previousStats[k]);
      return delta;
    })() : undefined
  };
}

/**
 * СБОРКА КОНТЕКСТА ДЛЯ AI
 */
export function buildAIAnalysisContext(insights: Insights, className: string, archetypeFromClass: string, userContext?: string): string {
  const lines: string[] = [];
  
  // 1. Идентичность и Путь
  const identityMatch = insights.determinedArchetype === archetypeFromClass 
    ? `гармоничен в роли **${archetypeFromClass}**` 
    : `носит имя **${archetypeFromClass}**, но душа его сейчас — **${insights.determinedArchetype}**`;
  
  const maturityMap = { nascent: 'чистый лист', emerging: 'первые всходы', developed: 'крепкое древо', mature: 'мудрый дуб' };
  
  lines.push(`Перед тобой герой класса **${className}**, который ${identityMatch}. Его опыт сейчас — это "${maturityMap[insights.profileMaturity]}".`);

  // 2. Драйверы
  const driverImages: Record<string, string> = {
    factor1: 'зов великого смысла', factor2: 'пламя созидания', factor3: 'нити родства',
    factor4: 'ветер перемен', factor5: 'тень утраты', factor6: 'тиски нехватки времени',
    factor7: 'хватка хозяина', factor8: 'вкус триумфа'
  };
  const drivers = insights.dominantFactors.slice(0, 2).map(f => driverImages[f.key]).join(' и ');
  lines.push(`В его сердце сейчас доминируют: ${drivers || 'тишина'}.`);

  // 3. Состояние Энергии (Burnout)
  lines.push('\n### СОСТОЯНИЕ ДУХА');
  const burnoutMap = {
    critical: `**ВНИМАНИЕ:** Герой истощен. Тёмная энергия поглотила его. Он бежит, чтобы не упасть. Твоя роль — тихая гавань. Никаких подвигов, только покой.`,
    high: `**ТРЕВОГА:** Тень перевешивает свет. Он действует из страха или нужды. Помоги ему вспомнить "зачем" он начал путь.`,
    moderate: `**НАПРЯЖЕНИЕ:** Равновесие шатко. Герой устал, но еще держится. Будь чутким, не дави.`,
    low: `**ГАРМОНИЯ:** Пламя чистое. Он готов к великим делам. Бросай вызов!`
  };
  lines.push(burnoutMap[insights.burnoutRisk]);

  // 4. Скрытые дефициты (SDT)
  const pains = [];
  if (insights.autonomy < 10) pains.push("потеря контроля");
  if (insights.competence < 10) pains.push("неверие в свои силы");
  if (insights.relatedness < 8) pains.push("одиночество среди людей");
  if (pains.length) lines.push(`\n**СКРЫТЫЕ БОЛИ (учитывай их):** ${pains.join(', ')}.`);

  // 5. Поведенческие маркеры
  const signals = [];
  if (insights.isolationRisk) signals.push("Одинокий маяк");
  if (insights.hoardingRisk) signals.push("Ловушка дракона");
  if (insights.harmony) signals.push("Редкий унисон всех сил");
  if (insights.polarization) signals.push("Одержимость одной целью");
  if (insights.turbulenceScore > 40) signals.push("Внутренний шторм");
  if (signals.length) lines.push(`\n**МАРКЕРЫ ПОВЕДЕНИЯ:** ${signals.join('. ')}.`);

  // 6. Стратегия
  lines.push('\n### ТВОЯ СТРАТЕГИЯ');
  if (insights.burnoutRisk === 'critical') {
    lines.push(`- ТОЛЬКО квесты на отдых, тишину и самопознание.\n- Тон: предельно мягкий, обволакивающий.`);
  } else if (insights.harmony) {
    lines.push(`- Квесты на углубление мастерства и наставничество.\n- Тон: уважительный, как к мастеру.`);
  } else {
    lines.push(`- Дай амбициозный квест, опираясь на его сильные стороны.\n- Тон: вдохновляющий, эпический.`);
  }

  if (userContext) lines.push(`\n**СЛОВА ИГРОКА:** "${userContext}" (вплети это в ответ).`);

  return lines.join('\n');
}
