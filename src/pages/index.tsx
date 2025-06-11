import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { format, isBefore, addDays, parseISO } from 'date-fns';

// Интерфейс вопроса для удобства и ясности
interface Question {
  id: number;
  text: string;
  positive_answer: string;
  negative_answer: string;
  weight: number;
}

// Массив вопросов вынесем отдельно для удобочитаемости
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

// Основной компонент страницы
export default function Home() {
  const router = useRouter();
  const { user, initData } = useTelegram();
  
  // Логика управления состоянием приложения
  const [questions] = useState<Question[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>( {} );
  const [initialBurnoutLevel, setInitialBurnoutLevel] = useState(0);
  const [burnoutLevel, setBurnoutLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  // Управление повторным прохождением теста
  const [alreadyAttempted, setAlreadyAttempted] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastDate = localStorage.getItem('lastAttemptDate');
      if (lastDate) {
        const today = new Date().toISOString().split('T')[0];
        return lastDate.split('T')[0] === today;
      }
    }
    return false;
  });

  // Загрузка данных пользователя
  const loadUserData = useCallback(async () => {
    try {
      setApiError(null);
      
      if (!user?.id) return;

      const response = await api.getUserData(Number(user.id), initData);

      if (response.success && response.data) {
        const userData = response.data;
        const level = userData.burnout_level ?? 0;
        
        setBurnoutLevel(level);
        setInitialBurnoutLevel(level);

        if (userData.last_attempt_date) {
          const today = new Date().toISOString().split('T')[0];
          const lastAttempt = new Date(userData.last_attempt_date).toISOString().split('T')[0];
          
          setAlreadyAttempted(today === lastAttempt);
        }
      } else {
        setApiError(response.error || "Ошибка загрузки данных");
      }
    } catch (err) {
      setApiError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }, [user?.id, initData]);

  // Обновление данных при изменении маршрута
  useEffect(() => {
    setLoading(true);
    loadUserData();
  }, [loadUserData]);

  // Наблюдатель за изменениями маршрутов
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

  // Функция обработки выбора ответа
  const handleAnswer = (questionId: number, isPositive: boolean) => {
    if (alreadyAttempted || !user) return;

    const question = questions.find(q => q.id === questionId);

    if (!question) return;

    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };

    setAnswers(newAnswers);

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

    const allAnswered = questions.every(q => q.id in newAnswers);

    if (allAnswered && !alreadyAttempted) {
      submitSurvey(answeredDelta);
    }
  };

  // Отправка результата тестирования
  const submitSurvey = async (totalScore: number) => {
    if (!user?.id) return;

    try {
      const response = await api.submitSurvey({
        telegramId: Number(user.id),
        newScore: totalScore,
        initData
      });

      if (response.success && response.data) {
        const updatedUser = response.data;
        const todayUTC = new Date().toISOString();

        setSurveyCompleted(true);
        setAlreadyAttempted(true);
        setBurnoutLevel(updatedUser.burnout_level);

        if (typeof window !== 'undefined') {
          localStorage.setItem('lastAttemptDate', todayUTC);
        }
      } else {
        setApiError(response.error || 'Ошибка сохранения результатов');
      }
    } catch (error) {
      console.error('Survey submission failed:', error);
      setApiError('Ошибка соединения с сервером');
    }
  };

  // Отображение ошибок и сообщений
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
      <BurnoutProgress level={burnoutLevel} />
      <div className="content">
        {apiError && (
          <div className="error-message">{apiError}</div>
        )}

        {alreadyAttempted ? (
          <div className="time-message">
            <div className="info-message">
              Вы уже прошли опрос сегодня. Ваш текущий уровень выгорания: {burnoutLevel}%
            </div>
          </div>
        ) : surveyCompleted ? (
          <div className="time-message">
            <div className="info-message">
              🎯 Тест завершен! Ваш уровень выгорания: {burnoutLevel}%
            </div>
          </div>
        ) : (
          <div className="questions">
            {questions.map(question => (
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

      {/* Меню навигации */}
      <div className="menu">
        <Link href="/" passHref>
          <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>📊</button>
        </Link>
        <Link href="/friends" passHref>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>📈</button>
        </Link>
        <Link href="/shop" passHref>
          <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>🛍️</button>
        </Link>
        <button className="menu-btn">ℹ️</button>
      </div>
    </div>
  );
}
