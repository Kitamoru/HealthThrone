// lib/octalysis.ts

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
  turbulence: number; // max - min
  whiteHatSum: number; // f1+f2+f3
  blackHatSum: number; // f4+f5+f6
  whiteHatDominant: boolean; // whiteHatSum > blackHatSum + 20%?
  blackHatDominant: boolean; // blackHatSum > whiteHatSum + 20%?
  determinedArchetype: Archetype; // на основе доминирующих факторов
  autonomy: number; // среднее f1,f2
  competence: number; // среднее f8,f2
  relatedness: number; // f3
  // специальные сигналы
  isolationRisk: boolean; // f3 < avg*0.7
  hoardingRisk: boolean; // f7 > avg*1.4
  harmony: boolean; // все факторы в пределах ±2 от avg
  oneFactorTooHigh: boolean; // какой-то фактор >25 при остальных низких
  // динамика (если есть предыдущие)
  changes?: Record<string, number>; // рост/падение
}

/**
 * Детерминированный анализ показателей Октализа.
 * @param stats – текущие показатели
 * @param previousStats – опционально, предыдущий замер для динамики
 */
export function computeInsights(
  stats: OctalysisStats,
  previousStats?: OctalysisStats
): Insights {
  const values = [
    stats.factor1,
    stats.factor2,
    stats.factor3,
    stats.factor4,
    stats.factor5,
    stats.factor6,
    stats.factor7,
    stats.factor8,
  ];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const turbulence = max - min;

  // Факторы с метками
  const labeled = [
    { key: 'factor1', value: stats.factor1, label: 'Эпическая значимость' },
    { key: 'factor2', value: stats.factor2, label: 'Творчество и обратная связь' },
    { key: 'factor3', value: stats.factor3, label: 'Социальное влияние' },
    { key: 'factor4', value: stats.factor4, label: 'Непредсказуемость' },
    { key: 'factor5', value: stats.factor5, label: 'Избегание потерь' },
    { key: 'factor6', value: stats.factor6, label: 'Дефицит и нетерпение' },
    { key: 'factor7', value: stats.factor7, label: 'Обладание и владение' },
    { key: 'factor8', value: stats.factor8, label: 'Достижения' },
  ];

  const dominantFactors = labeled.filter((f) => f.value > avg).sort((a, b) => b.value - a.value);
  const laggingFactors = labeled.filter((f) => f.value < avg).sort((a, b) => a.value - b.value);

  const whiteHatSum = stats.factor1 + stats.factor2 + stats.factor3;
  const blackHatSum = stats.factor4 + stats.factor5 + stats.factor6;

  const whiteHatDominant = whiteHatSum > blackHatSum * 1.2;
  const blackHatDominant = blackHatSum > whiteHatSum * 1.2;

  // Определяем архетип по доминирующим факторам
  let determinedArchetype: Archetype = 'Достигатор';
  const topFactors = dominantFactors.slice(0, 2).map((f) => f.key);
  if (topFactors.includes('factor2') || topFactors.includes('factor4')) {
    determinedArchetype = 'Исследователь';
  } else if (topFactors.includes('factor3') || topFactors.includes('factor1')) {
    determinedArchetype = 'Социализатор';
  } else if (topFactors.includes('factor5') || topFactors.includes('factor6')) {
    determinedArchetype = 'Завоеватель';
  } else {
    determinedArchetype = 'Достигатор';
  }

  // Базовые потребности (SDT)
  const autonomy = (stats.factor1 + stats.factor2) / 2;
  const competence = (stats.factor8 + stats.factor2) / 2;
  const relatedness = stats.factor3;

  // Специальные сигналы
  const isolationRisk = stats.factor3 < avg * 0.7;
  const hoardingRisk = stats.factor7 > avg * 1.4;
  const harmony = values.every((v) => Math.abs(v - avg) <= 2);
  const oneFactorTooHigh = values.some((v) => v > 25) && values.filter((v) => v < 15).length >= 5;

  // Динамика
  let changes: Record<string, number> | undefined;
  if (previousStats) {
    changes = {};
    (Object.keys(stats) as Array<keyof OctalysisStats>).forEach((key) => {
      changes[key] = stats[key] - previousStats[key];
    });
  }

  return {
    avg,
    max,
    min,
    dominantFactors,
    laggingFactors,
    turbulence,
    whiteHatSum,
    blackHatSum,
    whiteHatDominant,
    blackHatDominant,
    determinedArchetype,
    autonomy,
    competence,
    relatedness,
    isolationRisk,
    hoardingRisk,
    harmony,
    oneFactorTooHigh,
    changes,
  };
}

/**
 * Преобразует инсайты в текст для системного промпта (без чисел, с метафорами).
 * Этот текст будет передан AI как контекст.
 */
export function buildAIAnalysisContext(
  insights: Insights,
  className: string,
  archetypeFromClass: string, // архетип, закреплённый за классом
  userContext?: string
): string {
  const lines: string[] = [];

  // Класс и архетип
  lines.push(`Класс игрока: **${className}**.`);
  lines.push(`Архетип по данным: **${insights.determinedArchetype}**.`);
  if (insights.determinedArchetype !== archetypeFromClass) {
    lines.push(
      `(Интересно: по закреплению класса ты идёшь как **${archetypeFromClass}**, но сейчас твои цифры ближе к **${insights.determinedArchetype}**.)`
    );
  } else {
    lines.push(`Твой текущий архетип совпадает с закреплённым — **${archetypeFromClass}**.`);
  }

  // Доминирующие факторы (образно)
  if (insights.dominantFactors.length > 0) {
    const domLabels = insights.dominantFactors.map((f) => f.label).join(', ');
    lines.push(`Доминирующие факторы: **${domLabels}**.`);
  }
  if (insights.laggingFactors.length > 0) {
    const lagLabels = insights.laggingFactors.map((f) => f.label).join(', ');
    lines.push(`Отстающие факторы: **${lagLabels}**.`);
  }

  // Турбулентность
  if (insights.turbulence > 15) {
    lines.push('Турбулентность: высокая — внутри тебя настоящий шторм.');
  } else {
    lines.push('Турбулентность: умеренная.');
  }

  // Баланс шляп
  if (insights.blackHatDominant) {
    lines.push('Баланс мотивации: преобладает **чёрная шляпа** — срочность и давление.');
  } else if (insights.whiteHatDominant) {
    lines.push('Баланс мотивации: преобладает **белая шляпа** — устойчивая, питающая мотивация.');
  } else {
    lines.push('Баланс мотивации: гармоничный.');
  }

  // Базовые потребности (какая недополучена)
  const lowAutonomy = insights.autonomy < insights.avg * 0.8;
  const lowCompetence = insights.competence < insights.avg * 0.8;
  const lowRelatedness = insights.relatedness < insights.avg * 0.8;

  if (lowAutonomy || lowCompetence || lowRelatedness) {
    const missing: string[] = [];
    if (lowAutonomy) missing.push('автономия (выбор, смысл)');
    if (lowCompetence) missing.push('компетентность (рост, мастерство)');
    if (lowRelatedness) missing.push('связанность (принадлежность)');
    lines.push(`Недополученные базовые потребности: **${missing.join(', ')}**.`);
  }

  // Специальные сигналы
  if (insights.isolationRisk) {
    lines.push('Сигнал: возможная изоляция (социальная связь сильно ниже среднего).');
  }
  if (insights.hoardingRisk) {
    lines.push('Сигнал: риск накопительства (обладание сильно выше среднего).');
  }
  if (insights.harmony) {
    lines.push('Сигнал: гармония — все факторы сбалансированы.');
  }
  if (insights.oneFactorTooHigh) {
    lines.push('Сигнал: один фактор сильно выбивается, остальные низкие — риск однобокости.');
  }

  // Динамика (если есть)
  if (insights.changes) {
    const changesDesc = Object.entries(insights.changes)
      .filter(([_, delta]) => Math.abs(delta) >= 3) // только значимые изменения
      .map(([key, delta]) => {
        const dir = delta > 0 ? 'вырос' : 'упал';
        return `${key.replace('factor', 'Фактор ')} ${dir} на ${Math.abs(delta)}`;
      })
      .join(', ');
    if (changesDesc) {
      lines.push(`Динамика с прошлого раза: **${changesDesc}**.`);
    }
  }

  // Контекст от игрока
  if (userContext) {
    lines.push(`Контекст от игрока: "${userContext}".`);
  }

  return lines.join('\n');
}
