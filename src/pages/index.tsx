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
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    const currentScore = questions.reduce((score, question) => {
      const answer = newAnswers[question.id];
      return score + (answer ? question.weight : 0);
    }, 0);

    const level = Math.round((currentScore / totalWeight) * 100);
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