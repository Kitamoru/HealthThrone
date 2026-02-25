// ─── Типы ─────────────────────────────────────────────────────────────────────

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

export interface OctalysisInsights {
  /** Доминирующие факторы (выше среднего) — текстовые названия */
  dominantFactors: string[];
  /** Теневые факторы (ниже среднего) — текстовые названия */
  shadowFactors: string[];
  /** Есть ли внутренний шторм (разброс max–min > 15) */
  hasTurbulence: boolean;
  /** Режим мотивации */
  hatBalance: 'black_hat_dominant' | 'white_hat_dominant' | 'balanced';
  /** Архетип, вычисленный из цифр */
  computedArchetype: Archetype;
  /** Совпадает ли вычисленный архетип с переданным */
  archetypeMatches: boolean;
  /** Недополученные базовые потребности (SDT) */
  unmetNeeds: Array<'autonomy' | 'competence' | 'relatedness'>;
  /** Специальные сигналы для квестов */
  signals: string[];
  /** Динамика по сравнению с прошлым замером */
  dynamics?: {
    improved: string[];
    declined: string[];
  };
}

// ─── Вспомогательные данные ───────────────────────────────────────────────────

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

// ─── Основная функция расчёта ─────────────────────────────────────────────────

export function computeInsights(
  stats: OctalysisStats,
  passedArchetype: string,
  previousStats?: OctalysisStats
): OctalysisInsights {
  const values = Object.values(stats) as number[];
  const keys = Object.keys(stats) as (keyof OctalysisStats)[];

  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  // Доминирующие / теневые
  const dominantFactors = keys
    .filter(k => stats[k] > avg)
    .map(k => FACTOR_LABELS[k]);

  const shadowFactors = keys
    .filter(k => stats[k] < avg)
    .map(k => FACTOR_LABELS[k]);

  // Турбулентность
  const hasTurbulence =
    (max - min > 15) ||
    (avg > 5 && min > 0 && max / min > 2.5);

  // Баланс шляп
  const whiteHat = stats.factor1 + stats.factor2 + stats.factor3;
  const blackHat  = stats.factor4 + stats.factor5 + stats.factor6;
  const hatThreshold = Math.max(whiteHat, blackHat) * 0.2;

  let hatBalance: OctalysisInsights['hatBalance'];
  if (blackHat > whiteHat + hatThreshold) hatBalance = 'black_hat_dominant';
  else if (whiteHat > blackHat + hatThreshold) hatBalance = 'white_hat_dominant';
  else hatBalance = 'balanced';

  // Вычисленный архетип
  const computedArchetype = resolveArchetype(stats, avg);
  const archetypeMatches =
    computedArchetype.toLowerCase() === passedArchetype.toLowerCase();

  // SDT — недополученные потребности
  const sdt = avg * 0.80;
  const unmetNeeds: OctalysisInsights['unmetNeeds'] = [];
  if (stats.factor1 < sdt && stats.factor2 < sdt) unmetNeeds.push('autonomy');
  if (stats.factor8 < sdt && stats.factor2 < sdt) unmetNeeds.push('competence');
  if (stats.factor3 < sdt) unmetNeeds.push('relatedness');

  // Специальные сигналы
  const signals: string[] = [];

  if (stats.factor3 < avg * 0.7) {
    signals.push('isolation_risk');
  }

  if (stats.factor7 > avg * 1.4) {
    signals.push('hoarding_risk');
  }

  if (values.every(v => Math.abs(v - avg) <= 2)) {
    signals.push('harmony');
  }

  const topValue = Math.max(...values);
  const isSpiked = topValue > avg * 1.5 && values.filter(v => v > avg * 1.3).length === 1;
  if (isSpiked) {
    const spikedKey = keys.find(k => stats[k] === topValue);
    if (spikedKey) signals.push(`one_sided:${FACTOR_LABELS[spikedKey]}`);
  }

  // Динамика
  let dynamics: OctalysisInsights['dynamics'] | undefined;
  if (previousStats) {
    const improved = keys
      .filter(k => stats[k] > previousStats[k] + 2)
      .map(k => FACTOR_LABELS[k]);
    const declined = keys
      .filter(k => stats[k] < previousStats[k] - 2)
      .map(k => FACTOR_LABELS[k]);
    if (improved.length || declined.length) {
      dynamics = { improved, declined };
    }
  }

  return {
    dominantFactors,
    shadowFactors,
    hasTurbulence,
    hatBalance,
    computedArchetype,
    archetypeMatches,
    unmetNeeds,
    signals,
    dynamics,
  };
}

// ─── Определение архетипа ─────────────────────────────────────────────────────

function resolveArchetype(stats: OctalysisStats, avg: number): Archetype {
  const deviation = (key: keyof OctalysisStats) => stats[key] - avg;

  const scores: Record<Archetype, number> = {
    Достигатор:   Math.max(deviation('factor8'), deviation('factor7')),
    Исследователь: Math.max(deviation('factor2'), deviation('factor4')),
    Социализатор:  Math.max(deviation('factor3'), deviation('factor1')),
    Завоеватель:   Math.max(deviation('factor5'), deviation('factor6')),
  };

  return (Object.entries(scores) as [Archetype, number][]).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];
}

// ─── Сериализация инсайтов в читаемый текст для промта (только данные) ───────

export function insightsToPromptText(
  insights: OctalysisInsights,
  passedArchetype: string
): string {
  const sections: string[] = ['=== АНАЛИЗ ОКТАЛИЗА ===\n'];

  // ---- ОБЩАЯ КАРТИНА ----
  const general = [];
  if (insights.dominantFactors.length) {
    general.push(`Доминирующие факторы: ${insights.dominantFactors.join(', ')}`);
  }
  if (insights.shadowFactors.length) {
    general.push(`Теневые факторы: ${insights.shadowFactors.join(', ')}`);
  }
  general.push(`Турбулентность: ${insights.hasTurbulence ? 'высокая' : 'низкая'}`);
  const hatMap = {
    black_hat_dominant: 'чёрная шляпа доминирует',
    white_hat_dominant: 'белая шляпа доминирует',
    balanced: 'шляпы сбалансированы'
  };
  general.push(`Режим мотивации: ${hatMap[insights.hatBalance]}`);
  sections.push('ОБЩАЯ КАРТИНА:');
  general.forEach(g => sections.push(`- ${g}`));
  sections.push('');

  // ---- АРХЕТИП ----
  sections.push('АРХЕТИП:');
  sections.push(`- Вычисленный архетип: ${insights.computedArchetype}`);
  sections.push(`- Переданный архетип: ${passedArchetype}`);
  sections.push(`- Совпадение: ${insights.archetypeMatches ? 'да' : 'нет'}`);
  sections.push('');

  // ---- БАЗОВЫЕ ПОТРЕБНОСТИ ----
  sections.push('БАЗОВЫЕ ПОТРЕБНОСТИ:');
  if (insights.unmetNeeds.length) {
    const needNames = {
      autonomy: 'автономия',
      competence: 'компетентность',
      relatedness: 'связанность'
    };
    sections.push(`- Недополученные: ${insights.unmetNeeds.map(n => needNames[n]).join(', ')}`);
  } else {
    sections.push('- Все потребности в норме.');
  }
  sections.push('');

  // ---- ПОДСКАЗКИ ДЛЯ КВЕСТОВ ----
  const hints: string[] = [];
  for (const signal of insights.signals) {
    if (signal === 'isolation_risk') hints.push('Риск изоляции');
    else if (signal === 'hoarding_risk') hints.push('Риск накопительства');
    else if (signal === 'harmony') hints.push('Гармония (все факторы ровные)');
    else if (signal.startsWith('one_sided:')) hints.push(`Перекос: ${signal.replace('one_sided:', '')}`);
  }
  if (insights.dynamics) {
    if (insights.dynamics.improved.length) {
      hints.push(`Рост: ${insights.dynamics.improved.join(', ')}`);
    }
    if (insights.dynamics.declined.length) {
      hints.push(`Спад: ${insights.dynamics.declined.join(', ')}`);
    }
  }
  if (hints.length) {
    sections.push('ПОДСКАЗКИ ДЛЯ КВЕСТОВ:');
    hints.forEach(h => sections.push(`- ${h}`));
    sections.push('');
  }

  sections.push('=== КОНЕЦ АНАЛИЗА ===');
  return sections.join('\n');
}
