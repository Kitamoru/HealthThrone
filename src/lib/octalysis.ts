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

export type Archetype = 'Достигатор' | 'Исследователь' | 'Социализатор' | 'Завоеватель';

export interface Insights {
  avg: number;
  max: number;
  min: number;
  dominantFactors: Array<{ key: string; value: number; label: string }>;
  laggingFactors: Array<{ key: string; value: number; label: string }>;
  turbulence: number;
  whiteHatSum: number;
  blackHatSum: number;
  whiteHatDominant: boolean;
  blackHatDominant: boolean;
  burnoutScore: number; 
  burnoutStatus: 'stable' | 'alert' | 'critical';
  determinedArchetype: Archetype;
  autonomy: number;
  competence: number;
  relatedness: number;
  isolationRisk: boolean;
  hoardingRisk: boolean;
  harmony: boolean;
  oneFactorTooHigh: boolean;
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
 * Глубинный анализ показателей Октализа.
 */
export function computeInsights(
  stats: OctalysisStats,
  previousStats?: OctalysisStats
): Insights {
  const values = Object.values(stats);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const turbulence = max - min;

  const labeled = (Object.keys(stats) as Array<keyof OctalysisStats>).map((key) => ({
    key,
    value: stats[key],
    label: FACTOR_LABELS[key],
  }));

  const dominantFactors = labeled.filter((f) => f.value > avg).sort((a, b) => b.value - a.value);
  const laggingFactors = labeled.filter((f) => f.value < avg).sort((a, b) => a.value - b.value);

  // Группировка по "Шляпам"
  const whiteHatSum = stats.factor1 + stats.factor2 + stats.factor3;
  const blackHatSum = stats.factor4 + stats.factor5 + stats.factor6;
  const whiteHatDominant = whiteHatSum > blackHatSum * 1.2;
  const blackHatDominant = blackHatSum > whiteHatSum * 1.2;

  // Индекс выгорания (Burnout Score)
  const totalHatSum = whiteHatSum + blackHatSum;
  const burnoutScore = totalHatSum > 0 ? Math.round((blackHatSum / totalHatSum) * 100) : 0;
  let burnoutStatus: 'stable' | 'alert' | 'critical' = 'stable';
  if (burnoutScore > 65) burnoutStatus = 'critical';
  else if (burnoutScore > 40) burnoutStatus = 'alert';

  // Определение архетипа
  let determinedArchetype: Archetype = 'Достигатор';
  const topFactors = dominantFactors.slice(0, 2).map((f) => f.key);
  if (topFactors.includes('factor2') || topFactors.includes('factor4')) {
    determinedArchetype = 'Исследователь';
  } else if (topFactors.includes('factor3') || topFactors.includes('factor1')) {
    determinedArchetype = 'Социализатор';
  } else if (topFactors.includes('factor5') || topFactors.includes('factor6')) {
    determinedArchetype = 'Завоеватель';
  }

  // Базовые психологические потребности (Self-Determination Theory)
  const autonomy = (stats.factor1 + stats.factor2) / 2;
  const competence = (stats.factor8 + stats.factor2) / 2;
  const relatedness = stats.factor3;

  // Поведенческие сигналы
  const isolationRisk = stats.factor3 < avg * 0.7;
  const hoardingRisk = stats.factor7 > avg * 1.4;
  const harmony = values.every((v) => Math.abs(v - avg) <= 5);
  const oneFactorTooHigh = values.some((v) => v > 25) && values.filter((v) => v < 15).length >= 5;

  // Динамика
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
    avg, max, min, dominantFactors, laggingFactors, turbulence,
    whiteHatSum, blackHatSum, whiteHatDominant, blackHatDominant,
    burnoutScore, burnoutStatus, determinedArchetype, 
    autonomy, competence, relatedness,
    isolationRisk, hoardingRisk, harmony, oneFactorTooHigh, changes,
  };
}

/**
 * Преобразует инсайты в психологическую сводку для системного промпта AI.
 */
export function buildAIAnalysisContext(
  insights: Insights,
  className: string,
  archetypeFromClass: string,
  userContext?: string
): string {
  const lines: string[] = [];

  // 1. Идентичность
  lines.push(`### ПРОФИЛЬ ГЕРОЯ: ${className.toUpperCase()}`);
  const identityMatch = insights.determinedArchetype === archetypeFromClass
    ? `гармоничен в роли **${archetypeFromClass}**`
    : `выбрал роль **${archetypeFromClass}**, но сейчас проявляет черты **${insights.determinedArchetype}**`;
  lines.push(`Текущее проявление: Игрок ${identityMatch}.`);

  // 2. Драйверы и состояние выгорания
  const mainDrivers = insights.dominantFactors.slice(0, 2).map(f => f.label).join(' и ');
  lines.push(`Мотивация: **${mainDrivers}**.`);

  lines.push(`### ЭНЕРГЕТИЧЕСКИЙ РЕСУРС`);
  if (insights.burnoutStatus === 'critical') {
    lines.push(`СОСТОЯНИЕ: **Критическое выгорание** (${insights.burnoutScore}% темной энергии). Игрок истощен давлением, страхом или дефицитом. Срочно нужна эмоциональная разгрузка.`);
  } else if (insights.burnoutStatus === 'alert') {
    lines.push(`СОСТОЯНИЕ: **Тревожный звонок** (${insights.burnoutScore}%). Мотивация держится на стрессе. Есть риск сорваться в апатию.`);
  } else {
    lines.push(`СОСТОЯНИЕ: **Ясное пламя**. Мотивация здоровая, идет от внутренних смыслов.`);
  }

  // 3. Анализ Шляп
  if (insights.blackHatDominant) {
    lines.push(`Мотивационный фон: Преобладает  напряжение, спешка, страх упущенной выгоды. Тон общения должен быть обволакивающим и успокаивающим.`);
  } else if (insights.whiteHatDominant) {
    lines.push(`Мотивационный фон: Преобладает радость, смысл, творчество. Тон общения: воодушевляющий, партнерский.`);
  }

  // 4. Психологические дефициты
  const deficits: string[] = [];
  if (insights.autonomy < insights.avg * 0.8) deficits.push("потеря  способности к саморегуляции и принятию решений (чувствует себя марионеткой)");
  if (insights.competence < insights.avg * 0.8) deficits.push("неуверенность в своем мастерстве (синдром самозванца)");
  if (insights.relatedness < insights.avg * 0.8) deficits.push("жажда общения (нехватка сопричастности)");
  
  if (deficits.length > 0) {
    lines.push(`Скрытые боли: Игрок транслирует **${deficits.join(', ')}**.`);
  }

  // 5. Поведенческие маркеры
  if (insights.turbulence > 15) lines.push(`Сигнал: "Внутренний шторм" (высокая турбулентность). Игрока кидает из крайности в крайность.`);
  if (insights.isolationRisk) lines.push(`Сигнал: "Одинокий маяк". Связь с миром критически ослаблена.`);
  if (insights.hoardingRisk) lines.push(`Сигнал: "Ловушка дракона". Чрезмерная фиксация на накоплении ресурсов.`);

  // 6. Динамика изменений
  if (insights.changes) {
    const significant = Object.entries(insights.changes).filter(([_, d]) => Math.abs(d) >= 5);
    if (significant.length > 0) {
      lines.push(`Динамика духа:`);
      significant.forEach(([key, delta]) => {
        const name = FACTOR_LABELS[key as keyof OctalysisStats] || key;
        const trend = delta > 0 ? "усиливается" : "угасает";
        lines.push(`- ${name}: ${trend}.`);
      });
    }
  }

  // 7. Стратегия для Мудреца
  lines.push(`\n### ТВОЯ СТРАТЕГИЯ:`);
  if (insights.burnoutStatus === 'critical') {
    lines.push(`- НЕ предлагай достижений. Сфокусируйся на квестах-отдыхах и смысле.\n- Будь максимально эмпатичным наставником.`);
  } else if (insights.oneFactorTooHigh) {
    lines.push(`- Подсвети игроку его однобокость. Помоги увидеть красоту в других направлениях.`);
  } else {
    lines.push(`- Брось вызов. Игрок в хорошей форме для того, чтобы покорить новую вершину.`);
  }

  if (userContext) lines.push(`\nКонтекст игрока: "${userContext}"`);

  return lines.join('\n');
}
