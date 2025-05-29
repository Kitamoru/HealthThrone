import { useState, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { BurnoutProgress } from '@/components/BurnoutProgress';
import { QuestionCard } from '@/components/QuestionCard';
import type { Question } from '@/types';

// Примеры вопросов для тестирования
const sampleQuestions: Question[] = [
  {
    id: 1,
    text: "Чувствуете ли вы усталость даже после отдыха?",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 2
  },
  {
    id: 2,
    text: "Часто ли у вас возникает раздражительность на работе?",
    positive_answer: "Часто",
    negative_answer: "Редко",
    weight: 3
  },
  {
    id: 3,
    text: "Трудно ли вам концентрироваться на задачах?",
    positive_answer: "Трудно",
    negative_answer: "Легко",
    weight: 2
  },
  {
    id: 4,
    text: "Испытываете ли вы стресс от рабочих задач?",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 1
  },
  {
    id: 5,
    text: "Чувствуете ли вы себя перегруженным обязанностями?",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 3
  },
  {
    id: 6,
    text: "Я чувствую себя энергичным",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: -2
  },
  {
    id: 7,
    text: "Мне легко концентрироваться",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: -2
  },
  {
    id: 8,
    text: "Я получаю удовольствие от работы",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: -3
  },
  {
    id: 9,
    text: "Я хорошо сплю",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: -2
  },
  {
    id: 10,
    text: "Я чувствую себя мотивированным",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: -2
  },
  {
    id: 11,
    text: "У меня хороший аппетит",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: -1
  }
];

export default function Home() {
  const { user, isReady } = useTelegram();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [burnoutLevel, setBurnoutLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      if (!isReady) return;

      try {
        // Используем примеры вопросов вместо API
        setQuestions(sampleQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        // Fallback to sample questions
        setQuestions(sampleQuestions);
        setLoading(false);
      }
    };

    initializeApp();
  }, [isReady, user]);

  const handleAnswer = (questionId: number, isPositive: boolean) => {
    const newAnswers = { ...answers, [questionId]: isPositive };
    setAnswers(newAnswers);

    // Подсчет уровня выгорания
    const answeredQuestions = questions.filter(q => q.id in newAnswers);
    const maxPossibleScore = questions.reduce((sum, q) => sum + Math.abs(q.weight), 0);
    
    const currentScore = answeredQuestions.reduce((score, question) => {
      const answer = newAnswers[question.id];
      const weight = question.weight;
      
      if (weight > 0) {
        // Негативные вопросы: "Да" увеличивает выгорание
        return score + (answer ? weight : 0);
      } else {
        // Позитивные вопросы: "Нет" увеличивает выгорание
        return score + (answer ? 0 : Math.abs(weight));
      }
    }, 0);

    const level = Math.min(100, Math.max(0, Math.round((currentScore / maxPossibleScore) * 100)));
    setBurnoutLevel(level);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} />

      <div className="content">
        <div className="questions">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isAnswered={question.id in answers}
              onAnswer={(isPositive) => handleAnswer(question.id, isPositive)}
            />
          ))}
        </div>

        {Object.keys(answers).length === questions.length && (
          <div className="time-message">
            <div className="info-message">
              Тест завершен! Ваш уровень выгорания: {burnoutLevel}%
            </div>
          </div>
        )}
      </div>

      <div className="menu">
        <button className="menu-btn">📊</button>
        <button className="menu-btn">📝</button>
        <button className="menu-btn">⚙️</button>
        <button className="menu-btn">❓</button>
      </div>
    </div>
  );
}