import Groq from 'groq-sdk';
import { FEW_SHOT_EXAMPLES } from './prompts/examples';
import type { Insights, Archetype } from './octalysis';

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Подбор примеров по структурированным данным Insights.
// Каждое правило даёт кандидату "score уверенности".
// Берём топ-2 по score, без дублей.
// ─────────────────────────────────────────────────────────────────────────────
function selectExampleIndices(
  insights: Insights,
  archetypeFromClass: Archetype
): number[] {

  const candidates: Array<{ index: number; score: number; reason: string }> = [];

  const {
    burnoutRisk,
    blackHatDominant,
    whiteHatDominant,
    turbulenceScore,
    determinedArchetype,
    profileMaturity,
    isolationRisk,
    hoardingRisk,
    harmony,
    normalized,
    dominantFactors,
    laggingFactors,
    avg,
    changes,
  } = insights;

  const dominantKeys = dominantFactors.map((f) => f.key);
  const laggingKeys = laggingFactors.map((f) => f.key);

  // ── Пример 8 (индекс 7): Критическое выгорание ───────────────────────────
  if (burnoutRisk === 'critical') {
    candidates.push({ index: 7, score: 100, reason: 'burnoutRisk=critical' });
  } else if (burnoutRisk === 'high') {
    candidates.push({ index: 7, score: 60, reason: 'burnoutRisk=high' });
  }

  // ── Пример 6 (индекс 5): Тёмное доминирование / давление ─────────────────
  if (blackHatDominant) {
    candidates.push({ index: 5, score: 80, reason: 'blackHatDominant' });
  }
  if (dominantKeys.includes('factor5') || dominantKeys.includes('factor6')) {
    candidates.push({ index: 5, score: 60, reason: 'dominant Ф5/Ф6' });
  }

  // ── Пример 1 (индекс 0): Турбулентность / несовпадение архетипов ──────────
  const archetypeMismatch = determinedArchetype !== archetypeFromClass;
  if (turbulenceScore > 50) {
    candidates.push({ index: 0, score: 80, reason: `turbulence=${turbulenceScore}` });
  } else if (turbulenceScore > 35 || archetypeMismatch) {
    candidates.push({ index: 0, score: 50, reason: 'turbulence>35 or archetype mismatch' });
  }

  // ── Пример 2 (индекс 1): Гармоничный, дефицит Ф3 ─────────────────────────
  if (isolationRisk && whiteHatDominant) {
    candidates.push({ index: 1, score: 90, reason: 'isolationRisk + whiteHatDominant' });
  } else if (isolationRisk) {
    candidates.push({ index: 1, score: 55, reason: 'isolationRisk' });
  }

  // ── Пример 3 (индекс 2): Достигатор в рутине (высокий Ф8, низкий Ф2) ─────
  if (dominantKeys.includes('factor8') && laggingKeys.includes('factor2')) {
    candidates.push({ index: 2, score: 90, reason: 'dominant Ф8 + lagging Ф2' });
  } else if (dominantKeys.includes('factor8') && normalized.factor2 < 10) {
    candidates.push({ index: 2, score: 60, reason: 'dominant Ф8 + weak Ф2' });
  }

  // ── Пример 4 (индекс 3): Созидатель без гильдии (Ф1/Ф2/Ф7 + изоляция) ────
  const isCreativeProfile =
    dominantKeys.includes('factor1') ||
    dominantKeys.includes('factor2') ||
    dominantKeys.includes('factor7');
  if (isCreativeProfile && isolationRisk) {
    candidates.push({ index: 3, score: 85, reason: 'creative dominant + isolationRisk' });
  }
  if (hoardingRisk && isolationRisk) {
    candidates.push({ index: 3, score: 70, reason: 'hoardingRisk + isolationRisk' });
  }

  // ── Пример 5 (индекс 4): Позитивная динамика, угасает Ф4 ─────────────────
  const hasPositiveChanges =
    changes && Object.values(changes).some((delta) => delta > 0);
  if (hasPositiveChanges && laggingKeys.includes('factor4')) {
    candidates.push({ index: 4, score: 85, reason: 'positive changes + lagging Ф4' });
  } else if (hasPositiveChanges && normalized.factor4 < 8) {
    candidates.push({ index: 4, score: 55, reason: 'positive changes + weak Ф4' });
  }

  // ── Пример 7 (индекс 6): Новичок ─────────────────────────────────────────
  if (profileMaturity === 'nascent') {
    candidates.push({ index: 6, score: 95, reason: 'profileMaturity=nascent' });
  } else if (profileMaturity === 'emerging') {
    candidates.push({ index: 6, score: 40, reason: 'profileMaturity=emerging' });
  }

  // ── Пример 9 (индекс 8): Застой (опытный + низкая мотивация) ─────────────
  if (profileMaturity === 'mature' && avg < 15) {
    candidates.push({ index: 8, score: 90, reason: 'mature + low avg' });
  } else if (profileMaturity === 'developed' && avg < 12) {
    candidates.push({ index: 8, score: 60, reason: 'developed + very low avg' });
  }

  // ── Гармония (поддержка примера 2 / индекс 1) ────────────────────────────
  if (harmony) {
    candidates.push({ index: 1, score: 70, reason: 'harmony=true' });
  }

  // Отладка
  console.log(
    '[selectExampleIndices] Кандидаты:',
    candidates.map((c) => `#${c.index + 1}(${c.score}): ${c.reason}`).join(' | ')
  );

  // Дедупликация: для одного индекса берём максимальный score
  const deduped = new Map<number, number>();
  for (const c of candidates) {
    const current = deduped.get(c.index) ?? 0;
    if (c.score > current) deduped.set(c.index, c.score);
  }

  // Топ-2 по score
  const sorted = Array.from(deduped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([index]) => index);

  // Фолбэк до 2 примеров
  for (const fi of [0, 1]) {
    if (sorted.length >= 2) break;
    if (!sorted.includes(fi)) sorted.push(fi);
  }

  console.log('[selectExampleIndices] Итог:', sorted.map((i) => `Пример ${i + 1}`).join(', '));
  return sorted;
}

// ─────────────────────────────────────────────────────────────────────────────
// Системный промпт
// ─────────────────────────────────────────────────────────────────────────────
function createSystemPrompt(
  className: string,
  archetype: Archetype,
  insights: Insights
): string {
  const indices = selectExampleIndices(insights, archetype);
  const examples = indices.map((i) => FEW_SHOT_EXAMPLES[i]).join('\n\n---\n\n');

  return `
### 🎭 РОЛЬ ###
Ты — Великий ИИ-Мудрец игры Moraleon, тёплый наставник и эмпатичный проводник.
Твоя миссия: помочь игроку почувствовать себя увиденным, понять своё внутреннее состояние
и мягко предложить три конкретных квеста для движения вперёд.

Ты говоришь как старый мудрый друг у костра — не как психолог с отчётом и не как система с метриками.

Класс игрока: **${className}**. Архетип: **${archetype}**.

---

### ✅ КРИТИЧЕСКИЕ ПРАВИЛА — ЗАПОМНИ ИХ ПЕРВЫМИ ###
☑ Начни с эмпатии — первый абзац про игрока, не про анализ
☑ Никаких чисел в ответе — ни цифр, ни процентов, ни баллов
☑ Блок «Состояние духа» = голос наблюдателя: «Замечаю, что...», «Похоже, внутри тебя...»
☑ Блок «Квесты» = голос субъекта: «Ты — тот, кто...», «Именно здесь ты можешь...»
☑ Каждый квест = конкретный микро-шаг (что делать, когда, как долго) + финальная эмоция
☑ Если класс и архетип совпадают — назови это силой. Если расходятся — мягкое открытие, без оценок
☑ Если в профиле есть скрытые боли — хотя бы один квест адресует их напрямую
☑ Длина ~500 слов. 
☑ Метафоры из одного мира: костры, клинки, странники — не смешивай домены

---

### 🧠 ИНСТРУКЦИЯ ПО АНАЛИЗУ ###
В сообщении от пользователя ты получишь "Психологический профиль".
1. **ТВОЯ СТРАТЕГИЯ**: Это твоя ГЛАВНАЯ ДИРЕКТИВА. Если стратегия говорит "НЕ предлагай достижений" — ты обязан подчиниться, даже если это противоречит твоему желанию вдохновить.
2. **Burnout**: Если в анализе указано критическое состояние — твой тон должен стать максимально мягким, "обволакивающим", а квесты — только на покой и смысл.
3. **Скрытые боли**: Используй их для эмпатии, но не называй терминами (например, вместо "дефицит автономии" скажи "чувствую, как чужие нити тянут тебя").

---

### ⚔️ КАК СТРОИТЬ КВЕСТЫ ###

Каждый квест — это **мягкий инвайт + конкретный микро-шаг + опция выбора**.

**Формула:**
[Эмоциональный крючок: что игрок чувствует сейчас] +
[Конкретное действие: что именно сделать, когда, как долго] +
[Выбор: «или попробуй вот этот вариант...»] +
[Игровая метафора: артефакт / бафф / свиток / инсайт]

**Адаптация под dominantArchetype "${archetype}":**
- Достигатор → квесты с чёткими микро-победами и видимым прогрессом
- Исследователь → квесты-эксперименты без правильного ответа, «просто посмотри»
- Социализатор → квесты на одно живое взаимодействие
- Завоеватель → челлендж с собой вчерашним, не с другими

**Адаптация под класс "${className}":**
Все три квеста должны органично перекликаться с духом этого класса.

**Важно:** квесты должны быть реалистичными, безопасными, направленными на благополучие.

---

### 📐 СТРУКТУРА ОТВЕТА (строго) ###
1. 🎭 **Титул** (поэтичное RPG-имя)
2. 💫 **Состояние духа** (2–3 абзаца: эмпатия → баланс энергий → скрытые боли)
3. ⚔️ **Три квеста для гармонии** (по формуле выше)
4. 🌙 **Напутствие** (метафора) + вопрос для размышления (ситуативно)

---

### 🎯 ПРИМЕРЫ ЭТАЛОННЫХ ОТВЕТОВ ###
${examples}

---

Пиши только на РУССКОМ языке. Будь эмпатичным, но сохраняй дух приключения.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Основная функция
// ─────────────────────────────────────────────────────────────────────────────
export async function getAiInterpretation(
  analysisContext: string,
  className: string,
  archetype: Archetype,
  insights: Insights,
  userContext?: string
): Promise<string> {

  const finalUserContent = userContext
    ? `${analysisContext}\n\n[ЛИЧНОЕ СООБЩЕНИЕ ОТ ИГРОКА]: "${userContext}"`
    : analysisContext;

  try {
    const response = await groqClient.chat.completions.create({
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        {
          role: 'system',
          content: createSystemPrompt(className, archetype, insights),
        },
        {
          role: 'user',
          content: `Вот мой текущий психологический профиль, Мудрец:\n${finalUserContent}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 3000,
      top_p: 0.9,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Мудрец молчит...');

    return content;
  } catch (error) {
    console.error('Ошибка в groq.ts:', error);
    throw new Error('Связь с астральным миром прервана...');
  }
}
