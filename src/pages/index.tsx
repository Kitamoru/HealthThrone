import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram'; // импортируем кастомный хук для интеграции с Telegram
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { format, isBefore, addDays, parseISO } from 'date-fns';

// Список вопросов для тестирования уровня выгорания
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
  // остальные вопросы...
];

// Основной компонент страницы
export default function Home() {
  const router = useRouter();
  const { user, initData } = useTelegram(); // получаем доступ к данным пользователя и инициатору Telegram
  const [questions] = useState<Question[]>(QUESTIONS); // фиксируем список вопросов
  const [answers, setAnswers] = useState<Record<number, boolean>>({}); // храним ответы пользователей
  const [initialBurnoutLevel, setInitialBurnoutLevel] = useState(0); // начальный уровень выгорания
  const [burnoutLevel, setBurnoutLevel] = useState(0); // текущий уровень выгорания
  const [loading, setLoading] = useState(true); // индикатор загрузки
  const [apiError, setApiError] = useState<string | null>(null); // сообщение об ошибке от API
  const [surveyCompleted, setSurveyCompleted] = useState(false); // статус завершения анкетирования
  const [alreadyAttempted, setAlreadyAttempted] = useState(false); // прошел ли тест ранее сегодня?

  // Функция загрузки профиля пользователя и проверки статуса анкеты
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
          const today = new Date().toISOString().split('T')[0]; // текущая дата
          const lastAttempt = new Date(userData.last_attempt_date).toISOString().split('T')[0]; // дата последней попытки
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

  // Хуки жизненного цикла
  useEffect(() => {
    loadUserData(); // подгружаем профиль пользователя при первом рендере
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      if (router.pathname === '/') {
        loadUserData(); // повторная загрузка данных при возврате на главную страницу
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  // Обработчик выбора ответа на вопрос
  const handleAnswer = (questionId: number, isPositive: boolean) => {
    if (alreadyAttempted || !user) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };
    setAnswers(newAnswers);

    // Расчёт нового уровня выгорания на основе выбранных ответов
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

    // Если все вопросы были заполнены, отправляем результаты на сервер
    const allAnswered = questions.every(q => q.id in newAnswers);
    if (allAnswered && !alreadyAttempted) {
      submitSurvey(answeredDelta);
    }
  };

  // Отправляет результаты теста на сервер
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
      console.error('Ошибка отправки анкеты:', error.message);
      setApiError(error.message || 'Ошибка сервера');
    }
  };

  // Рендеринг страницы
  if (!user) {
    return (
      <div className="error-message">
        Не удалось загрузить данные пользователя. Перезагрузите приложение.
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} /> {/* прогресс бар уровня выгорания */}

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
              🎯 Тест завершён! Ваш уровень выгорания: {burnoutLevel}%
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
