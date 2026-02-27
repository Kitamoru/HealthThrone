// pages/api/generate-questions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateDailyQuestions } from '@/lib/groq';

const STATIC_QUESTIONS = [
  { id: 1,  text: "Сумели ли вы сегодня удержаться на ногах под натиском тёмных сил?" },
  { id: 2,  text: "Чувствовали ли вы сегодня, что пламя в вашей душе горит ярко, а свершения наполняют вас радостью?" },
  { id: 3,  text: "Ощущали ли вы сегодня, что служите великой цели гильдии, а не просто выполняете команды гильдмастера?" },
  { id: 4,  text: "Чувствовали ли вы сегодня, что сами держите штурвал своего корабля, а не ведомы чужой волей?" },
  { id: 5,  text: "Чувствовали ли вы сегодня, что ваш голос или действия повлияли на решения или дух отряда?" },
  { id: 6,  text: "Преподнес ли сегодняшний день неожиданную встречу, загадку или событие, что пробудило Ваш интерес?" },
  { id: 7,  text: "Помогло ли вам сегодня ощущение, что промедление может стоить вам важного шанса или артефакта?" },
  { id: 8,  text: "Придавали ли вам энергии сегодня редкие ресурсы или срочные вызовы?" },
  { id: 9,  text: "Удалось ли вам сегодня завладеть новым ценным трофеем, артефактом, или знанием, усиливающим вашу мощь?" },
  { id: 10, text: "Смогли ли вы сегодня продвинуться в мастерстве или заслужить признание от других героев?" },
];

type Question = { id: number; text: string };

/**
 * Нормализует и сортирует массив вопросов:
 * 1. Гарантирует, что у каждого элемента есть числовой id и непустой text.
 * 2. Сортирует по возрастанию id.
 * 3. Если после фильтрации вопросов не осталось — возвращает статический список.
 */
function normalizeAndSort(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return STATIC_QUESTIONS;

  const valid: Question[] = raw
    .map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return null;
      const q = item as Record<string, unknown>;
      const id = typeof q.id === 'number' ? q.id : Number(q.id);
      const text = typeof q.text === 'string' ? q.text.trim() : '';
      if (!Number.isFinite(id) || !text) return null;
      return { id, text };
    })
    .filter((q): q is Question => q !== null);

  if (valid.length === 0) return STATIC_QUESTIONS;

  return valid.sort((a, b) => a.id - b.id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const raw = await generateDailyQuestions();
    const questions = normalizeAndSort(raw);
    return res.status(200).json({ questions });
  } catch (error) {
    console.error('[generate-questions] Groq error:', error);
    return res.status(200).json({ questions: STATIC_QUESTIONS });
  }
}
