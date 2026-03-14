// lib/aiValidator.ts
// Слой 1 валидации AI-ответов: структура, символы, запрещённые слова
// Используется в generate-questions и interpretation

// ─── Типы ────────────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

// ─── Общие проверки ───────────────────────────────────────────────────────────

/** Китайские, японские, корейские символы — артефакт Kimi K2 / Moonshot */
const CJK_REGEX = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;

/** Офисные слова запрещены по промпту — только самые однозначные */
const FORBIDDEN_WORDS = [
  'дедлайн', 'коллеги', 'продуктивность',
  'эффективность', 'митинг', 'офис',
  // НЕ включаем: 'встреча', 'задача', 'проект', 'менеджер', 'мотивация'
  // они встречаются в допустимых фэнтезийных контекстах
];

function hasCJK(text: string): boolean {
  return CJK_REGEX.test(text);
}

function hasForbiddenWords(text: string): string | null {
  const lower = text.toLowerCase();
  const found = FORBIDDEN_WORDS.find(w => lower.includes(w));
  return found ?? null;
}

function isTooShort(text: string, min: number): boolean {
  return text.trim().length < min;
}

// ─── Валидатор вопросов (generate-questions) ─────────────────────────────────

export type Question = { id: number; text: string };

/**
 * Проверяет массив из 10 вопросов.
 * Возвращает первую найденную ошибку или { ok: true }.
 */
export function validateQuestions(questions: Question[]): ValidationResult {
  if (questions.length !== 10) {
    return { ok: false, reason: `Ожидалось 10 вопросов, получено ${questions.length}` };
  }

  // Все id от 1 до 10 без дублей
  const ids = questions.map(q => q.id).sort((a, b) => a - b);
  const expectedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (ids.join(',') !== expectedIds.join(',')) {
    return { ok: false, reason: `Некорректные id вопросов: [${ids.join(', ')}]` };
  }

  for (const q of questions) {
    // CJK символы
    if (hasCJK(q.text)) {
      return { ok: false, reason: `Вопрос id=${q.id} содержит CJK символы` };
    }

    // Минимальная длина (осмысленный вопрос — от 30 символов)
    if (isTooShort(q.text, 30)) {
      return { ok: false, reason: `Вопрос id=${q.id} слишком короткий: "${q.text}"` };
    }

    // Запрещённые офисные слова
    const forbidden = hasForbiddenWords(q.text);
    if (forbidden) {
      return { ok: false, reason: `Вопрос id=${q.id} содержит запрещённое слово "${forbidden}"` };
    }

    // Должен быть вопросом (заканчивается на ? или ?")
    if (!/\?["»]?$/.test(q.text.trim())) {
      return { ok: false, reason: `Вопрос id=${q.id} не заканчивается на "?": "${q.text}"` };
    }
  }

  return { ok: true };
}

// ─── Валидатор ответа ИИ-Мудреца (interpretation) ────────────────────────────

/**
 * Проверяет текст ответа ИИ-Мудреца.
 * Структура: Титул → Состояние духа → 3 квеста → Напутствие
 */
export function validateInterpretation(text: string): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { ok: false, reason: 'Пустой ответ от AI' };
  }

  // CJK символы
  if (hasCJK(text)) {
    return { ok: false, reason: 'Ответ содержит CJK символы (артефакт модели)' };
  }

  // Минимальная длина осмысленного ответа
  if (isTooShort(text, 200)) {
    return { ok: false, reason: `Ответ слишком короткий (${text.length} символов)` };
  }

  // Обязательные структурные блоки
  const requiredSections = [
    { pattern: /титул|🎭/i,         label: 'Титул' },
    { pattern: /состояни|дух|💫/i,  label: 'Состояние духа' },
    { pattern: /напутстви|🌙/i,     label: 'Напутствие' },
  ];

  for (const section of requiredSections) {
    if (!section.pattern.test(text)) {
      return { ok: false, reason: `Отсутствует секция "${section.label}"` };
    }
  }

  // Минимум 2 квеста (формат: «Название» или **Название**)
  const questMatches = text.match(/[«"*]{1,2}[^«»"*\n]{3,50}[»"*]{1,2}/g) ?? [];
  if (questMatches.length < 2) {
    return { ok: false, reason: `Найдено менее 2 квестов (найдено: ${questMatches.length})` };
  }

  return { ok: true };
}
