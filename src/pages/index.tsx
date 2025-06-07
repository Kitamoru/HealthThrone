import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';
import { api, Sprite } from '../lib/api'; // Добавлен импорт Sprite
import { UserProfile } from '../lib/supabase';
import { format } from 'date-fns';

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
  const { user, initData } = useTelegram();
  const [questions] = useState<Question[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [initialBurnoutLevel, setInitialBurnoutLevel] = useState(0); // Загруженный из базы уровень
  const [currentBurnoutDelta, setCurrentBurnoutDelta] = useState(0); // Дельта в текущей сессии
  const [burnoutLevel, setBurnoutLevel] = useState(0); // = initialBurnoutLevel + currentBurnoutDelta
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [spriteUrl, setSpriteUrl] = useState<string | undefined>(undefined);

     // Выносим загрузку данных в отдельную функцию
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.getUserData(user.id, initData);
      if (response.success && response.data) {
        const userData = response.data as UserProfile;
        const level = userData.burnout_level || 0;
        setInitialBurnoutLevel(level);
        setBurnoutLevel(level);
        
        // Проверка последней попытки
        const today = format(new Date(), 'yyyy-MM-dd');
        if (userData.last_attempt_date === today) {
          setAlreadyAttempted(true);
        } else {
          setAlreadyAttempted(false);
          setAnswers({}); // Сбрасываем ответы если новый день
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, initData]);

  // Загружаем данные при монтировании и изменении пользователя
  useEffect(() => {
    setLoading(true);
    loadUserData();
  }, [loadUserData]);

  // Загружаем данные при возврате на страницу
  useEffect(() => {
    const handleRouteChange = () => {
      if (router.pathname === '/') {
        loadUserData();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [loadUserData, router]);

  const handleAnswer = async (questionId: number, isPositive: boolean) => {
    if (alreadyAttempted || !user) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };
    setAnswers(newAnswers);

    // Рассчитываем дельту на основе ответов
    let answeredDelta = 0;
    Object.entries(newAnswers).forEach(([id, ans]) => {
      const qId = parseInt(id);
      const q = questions.find(q => q.id === qId);
      if (q && ans) {
        answeredDelta += q.weight;
      }
    });
    
    const newLevel = Math.max(0, Math.min(100, initialBurnoutLevel + answeredDelta));
    setBurnoutLevel(newLevel);

    // Сохраняем промежуточный прогресс
    try {
      await api.updateBurnoutLevel(user.id, newLevel, initData);
    } catch (error) {
      console.error('Error saving burnout level:', error);
    }

    // Проверяем завершение опроса
    const allAnswered = questions.every(q => q.id in newAnswers);
    if (allAnswered && !alreadyAttempted) {
      try {
        await api.updateAttemptDate(user.id, initData);
        setAlreadyAttempted(true);
      } catch (error) {
        console.error('Failed to update attempt date:', error);
        setApiError('Ошибка сохранения данных. Попробуйте еще раз.');
      }
    }
  };

  if (!user) {
    return (
      <div className="error-message">
        Не удалось загрузить данные пользователя. Пожалуйста, перезапустите приложение.
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} spriteUrl={spriteUrl} />
      
      <div className="content">
        {alreadyAttempted || allAnswered ? (
          <div className="time-message">
            <div className="info-message">
              {alreadyAttempted 
                ? "Данные за сегодняшний день собраны, ждем Вас завтра!" 
                : `🎯 Тест завершен! Ваш уровень выгорания: ${burnoutLevel}%`}
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
        <Link href="/" passHref>
          <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>
            📊
          </button>
        </Link>
        <Link href="/friends" passHref>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
            📈
          </button>
        </Link>
        <Link href="/shop" passHref>
          <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>
            🛍️
          </button>
        </Link>
        <button className="menu-btn">ℹ️</button>
      </div>
    </div>
  );
}
