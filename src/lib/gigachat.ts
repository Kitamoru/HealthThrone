mport { v4 as uuidv4 } from 'uuid';

// Типизация для данных Октализа
export interface OctalysisStats {
  factor1: number; // Значимость
  factor2: number; // Творчество
  factor3: number; // Соц. влияние
  factor4: number; // Непредсказуемость
  factor5: number; // Избегание потерь
  factor6: number; // Дефицит
  factor7: number; // Обладание
  factor8: number; // Достижения
}

const AUTH_DATA = process.env.GIGACHAT_AUTH_DATA; // Base64 из личного кабинета
const SCOPE = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

/**
 * Получение токена доступа (Access Token)
 */
async function getAccessToken(): Promise<string> {
  // ВНИМАНИЕ: Хак для обхода проблем с SSL сертификатами Сбера в Node.js
  // В продакшене лучше установить сертификаты Минцифры
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const response = await fetch('https://ngw.devices.sberbank.ru', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${AUTH_DATA}`,
      'RqUID': uuidv4(),
    },
    body: new URLSearchParams({ scope: SCOPE }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GigaChat Auth Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Основная функция интерпретации данных
 */
export async function getAiInterpretation(stats: OctalysisStats): Promise<string> {
  const token = await getAccessToken();

  // Маппинг ключей в понятные для ИИ названия
  const labels: Record<keyof OctalysisStats, string> = {
    factor1: "Эпическая значимость (Meaning)",
    factor2: "Творчество и обратная связь (Empowerment)",
    factor3: "Социальное влияние (Social Influence)",
    factor4: "Непредсказуемость (Unpredictability)",
    factor5: "Избегание потерь (Avoidance)",
    factor6: "Дефицит и нетерпение (Scarcity)",
    factor7: "Обладание и владение (Ownership)",
    factor8: "Достижения (Accomplishment)"
  };

  // Формируем текстовое описание профиля
  const statsSummary = Object.entries(stats)
    .map(([key, val]) => `${labels[key as keyof OctalysisStats]}: ${val}/30`)
    .join('\n');

  const systemPrompt = `Ты — Великий ИИ-Мастер игры Moraleon. 
Твоя задача — анализировать 8 векторов Октализа игрока (шкала от 0 до 30).
ПРАВИЛА АНАЛИЗА:
- Факторы 1, 2, 8 — "Белые шляпы" (дают счастье и смысл). Если они низкие, игрок выгорает.
- Факторы 4, 5, 6 — "Черные шляпы" (дают драйв и стресс). Если они > 25, игрок в зоне риска.
- Факторы 3, 7 — Социальное взаимодействие и прогресс.

ОТВЕТЬ В СТИЛЕ RPG-НАСТАВНИКА:
1. Краткий диагноз состояния "энергии" игрока.
2. 3 конкретных квеста (совета) для балансировки показателей.
3. Используй игровую терминологию (артефакты, уровни, дебаффы).
Отвечай на русском языке, будь лаконичен.`;

  const response = await fetch('https://gigachat.devices.sberbank.ru', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'GigaChat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Вот мои показатели Октализа:\n${statsSummary}` }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`GigaChat API Error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}
