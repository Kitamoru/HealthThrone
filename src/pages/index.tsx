
import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';

interface Question {
  id: number;
  text: string;
  positive_answer: string;
  negative_answer: string;
  weight: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Я чувствую усталость даже после отдыха",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 3
  },
  {
    id: 2,
    text: "Мне трудно сосредоточиться на работе",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 2
  },
  {
    id: 3,
    text: "Я часто чувствую раздражение",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 2
  },
  {
    id: 4,
    text: "У меня снизилась мотивация к работе",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 3
  },
  {
    id: 5,
    text: "Я испытываю физическое напряжение",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 2
  },
  {
    id: 6,
    text: "Мне сложно расслабиться",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 2
  },
  {
    id: 7,
    text: "Я чувствую себя эмоционально истощенным",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 3
  },
  {
    id: 8,
    text: "У меня есть проблемы со сном",
    positive_answer: "Да",
    negative_answer: "Нет",
    weight: 2
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
        // Симуляция загрузки для лучшего UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Загружаем вопросы
        setQuestions(QUESTIONS);
        
        // Загружаем данные пользователя если есть
        if (user?.id) {
          try {
            const response = await fetch(`/api/data?userId=${user.id}`);
            const data = await response.json();
            
            if (data.success && data.data) {
              setBurnoutLevel(data.data.burnout_level || 0);
            }
          } catch (error) {
            console.log('Не удалось загрузить данные пользователя');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, [isReady, user]);

  const handleAnswer = async (questionId: number, isPositive: boolean) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // Обновляем локальные ответы
    setAnswers(prev => ({
      ...prev,
      [questionId]: isPositive
    }));

    // Рассчитываем изменение уровня выгорания
    const delta = isPositive ? question.weight : 0;
    const newLevel = Math.max(0, Math.min(100, burnoutLevel + delta));
    
    setBurnoutLevel(newLevel);

    // Отправляем данные на сервер если есть пользователь
    if (user?.id) {
      try {
        await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            burnoutLevel: newLevel
          })
        });
      } catch (error) {
        console.log('Не удалось сохранить данные');
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  const allAnswered = questions.every(q => q.id in answers);

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} />
      
      <div className="content">
        {allAnswered ? (
          <div className="time-message">
            <div className="info-message">
              🎯 Тест завершен! Ваш уровень выгорания: {burnoutLevel}%
              <br />
              Попробуйте снова завтра для отслеживания динамики.
            </div>
          </div>
        ) : (
          <div className="questions">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswer={handleAnswer}
                answered={question.id in answers}
              />
            ))}
          </div>
        )}
      </div>

      <div className="menu">
        <button className="menu-btn">📊</button>
        <button className="menu-btn">📈</button>
        <button className="menu-btn">⚙️</button>
        <button className="menu-btn">ℹ️</button>
      </div>
    </div>
  );
}
