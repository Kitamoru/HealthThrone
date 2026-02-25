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
