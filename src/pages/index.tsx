import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile } from '../lib/supabase';

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
  const router = useRouter();
  const { user } = useTelegram();
  
  const [questions] = useState<Question[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [burnoutLevel, setBurnoutLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        const response = await api.getUserData(user.id);
        if (response.success && response.data) {
          const userData = response.data as UserProfile;
          setBurnoutLevel(userData.burnout_level || 0);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading user data:', err);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user?.id]);

    const handleAnswer = async (questionId: number, isPositive: boolean) => {
    console.log(`[Home] Handling answer for question ${questionId}: ${isPositive}`);
    
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      console.warn(`[Home] Question not found: ${questionId}`);
      return;
    }

    // Обновляем локальные ответы
    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };
    setAnswers(newAnswers);

    // Рассчитываем изменение уровня выгорания
    const delta = isPositive ? question.weight : 0;
    const newLevel = Math.max(0, Math.min(100, burnoutLevel + delta));
    setBurnoutLevel(newLevel);
    console.log(`[Home] New burnout level: ${newLevel}%`);

    // Отправляем данные на сервер если есть пользователь
    if (user?.id) {
      console.log(`[Home] Saving burnout level for user ${user.id}`);
      
      try {
        const saveResponse = await api.updateBurnoutLevel(user.id, newLevel);
        console.log('[Home] Save response:', saveResponse);
        
        if (!saveResponse.success) {
          console.error('[Home] Failed to save burnout level:', saveResponse.error);
        }
      } catch (error) {
        console.error('[Home] Error saving burnout level:', error);
      }
    } else {
      console.warn('[Home] Skipping save - no user ID');
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

      <div className="menu-btn">
        <Link href="/" passHref>
          <button className="menu-btn">📊</button>
        </Link>
        <Link href="/friends" passHref>
          <button className="menu-btn">📈</button>
        </Link>
        <button className="menu-btn">⚙️</button>
        <button className="menu-btn">ℹ️</button>
      </div>
      
      {/* Диагностическая панель (только в development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: '#f0f0f0',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <h3>Debug Information:</h3>
          <pre>{JSON.stringify({
            user: user ? { id: user.id, name: user.first_name } : null,
            burnoutLevel,
            answeredQuestions: Object.keys(answers).length,
            apiError
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
