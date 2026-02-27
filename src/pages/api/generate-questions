// pages/api/generate-questions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const STATIC_QUESTIONS = [
  { id: 1, text: "Сумели ли вы сегодня удержаться на ногах под натиском тёмных сил?" },
  { id: 2, text: "Чувствовали ли вы сегодня, что пламя в вашей душе горит ярко, а свершения наполняют вас радостью?" },
  { id: 3, text: "Ощущали ли вы сегодня, что служите великой цели гильдии, а не просто выполняете команды гильдмастера?" },
  { id: 4, text: "Чувствовали ли вы сегодня, что сами держите штурвал своего корабля, а не ведомы чужой волей?" },
  { id: 5, text: "Чувствовали ли вы сегодня, что ваш голос или действия повлияли на решения или дух отряда?" },
  { id: 6, text: "Преподнес ли сегодняшний день неожиданную встречу, загадку или событие, что пробудило Ваш интерес?" },
  { id: 7, text: "Помогло ли вам сегодня ощущение, что промедление может стоить вам важного шанса или артефакта?" },
  { id: 8, text: "Придавали ли вам энергии сегодня редкие ресурсы или срочные вызовы?" },
  { id: 9, text: "Удалось ли вам сегодня завладеть новым ценным трофеем, артефактом, или знанием, усиливающим вашу мощь?" },
  { id: 10, text: "Смогли ли вы сегодня продвинуться в мастерстве или заслужить признание от других героев?" },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const prompt = `Ты — мастер подземелий в игре, где игроки ежедневно отвечают на вопросы о своей мотивации. 
    Нужно сгенерировать 10 вопросов на русском языке, каждый из которых соответствует одному из факторов геймификации Octalysis.
    Каждый вопрос должен быть сформулирован иначе, чем в предыдущие разы, но сохранять связь с фактором.
    Вот факторы и их краткое описание:
    1. Эпическое предназначение (Calling) — вопросы о служении великой цели, вере в миссию.
    2. Развитие и достижение — вопросы о прогрессе, росте навыков, получении наград.
    3. Расширение творчества — вопросы о возможности влиять, принимать решения, выражать себя.
    4. Владение и обладание — вопросы о накоплении ресурсов, артефактов, знаний.
    5. Социальное влияние — вопросы о взаимодействии, помощи другим, признании.
    6. Дефицит и нетерпение — вопросы о срочности, ограниченности во времени, редких шансах.
    7. Непредсказуемость и любопытство — вопросы о неожиданностях, открытиях, тайнах.
    8. Потеря и избегание — вопросы о страхе упустить возможность, потерять достигнутое.

    Важно: вопросы 1 и 2 будут влиять на уровень "выгорания" (burnout). Они должны отражать: первый — способность противостоять трудностям, второй — ощущение радости и энергии.
    Остальные вопросы (3–10) соответствуют восьми факторам в том же порядке, что и выше.

    Верни строго JSON-объект с ключом "questions", содержащий массив из 10 объектов, каждый с полями "id" (число от 1 до 10) и "text" (строка с вопросом). Никакого дополнительного текста.
    Пример формата:
    {
      "questions": [
        {"id": 1, "text": "Сумели ли вы сегодня удержаться на ногах под натиском тёмных сил?"},
        {"id": 2, "text": "Чувствовали ли вы сегодня, что пламя в вашей душе горит ярко, а свершения наполняют вас радостью?"}
      ]
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.65,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    const parsed = JSON.parse(content);

    // Groq с json_object всегда возвращает объект — достаём массив из него
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;

    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error('Invalid response format');
    }

    const validQuestions = questions.filter(
      (q: any) => typeof q.id === 'number' && q.id >= 1 && q.id <= 10 && typeof q.text === 'string' && q.text.trim()
    );

    if (validQuestions.length !== 10) {
      throw new Error('Questions failed validation');
    }

    return res.status(200).json({ questions: validQuestions });
  } catch (error) {
    console.error('Question generation error:', error);
    // Фолбек на статические вопросы
    return res.status(200).json({ questions: STATIC_QUESTIONS });
  }
}
