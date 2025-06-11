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

// Функция расчета нового уровня выгорания
const calculateBurnoutLevel = (initialLevel: number, answers: Record<number, boolean>, questions: Question[]) => {
  let delta = 0;
  Object.keys(answers).forEach((key) => {
    const answerIndex = parseInt(key); // Конвертируем строку в число
    const question = questions.find(q => q.id === answerIndex);
    if (question && answers[answerIndex]) { // Теперь используем правильный числовой индекс
      delta += question.weight;
    }
  });
  return Math.max(0, Math.min(100, initialLevel + delta)); // Ограничиваем уровень от 0 до 100
};

export default function Home() {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const [questions] = useState<Question[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [initialBurnoutLevel, setInitialBurnoutLevel] = useState(0);
  const [burnoutLevel, setBurnoutLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  const loadUserData = useCallback(async () => {
    setApiError(null);
    if (!user?.id) return;

    try {
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

  useEffect(() => {
    setLoading(true);
    loadUserData();
  }, [loadUserData]);

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

  const handleAnswer = (questionId: number, isPositive: boolean) => {
    if (alreadyAttempted || !user) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };
    setAnswers(newAnswers);

    // Пересчет уровня выгорания
    const newLevel = calculateBurnoutLevel(initialBurnoutLevel, newAnswers, questions);
    setBurnoutLevel(newLevel);

    // Проверка завершения теста
    const allAnswered = questions.every(q => q.id in newAnswers);
    if (allAnswered && !alreadyAttempted) {
      submitSurvey(newLevel - initialBurnoutLevel);
    }
  };

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
      } else {
        setApiError(response.error || 'Ошибка сохранения результатов');
      }
    } catch (error) {
      console.error('Survey submission failed:', error);
      setApiError('Ошибка соединения с сервером');
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
