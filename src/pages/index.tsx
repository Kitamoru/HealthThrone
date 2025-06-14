import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { format, parseISO } from 'date-fns';

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
  const [currentBurnoutLevel, setCurrentBurnoutLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // Загрузка данных пользователя
  const loadUserData = useCallback(async () => {
    try {
      setApiError(null);
      
      if (!user?.id) return;

      const response = await api.getUserData(Number(user.id), initData);

      if (response.success && response.data) {
        const userData = response.data;
        const level = userData.burnout_level ?? 0;
        
        setCurrentBurnoutLevel(level);

        // Проверка последней попытки
        if (userData.last_attempt_date) {
          const todayUTC = new Date().toISOString().split('T')[0];
          setAlreadyAttempted(userData.last_attempt_date === todayUTC);
        }
      } else {
        // Обработка специфических ошибок
        if (response.status === 429) {
          setApiError("Вы уже проходили опрос сегодня");
        } else {
          setApiError(response.error || "Ошибка загрузки данных");
        }
      }
    } catch (err) {
      setApiError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }, [user?.id, initData]);

  // Загрузка данных при монтировании
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadUserData();
    };
    fetchData();
  }, []); // Пустой массив зависимостей

  // Обработка выбора ответа
  const handleAnswer = (questionId: number, isPositive: boolean) => {
    if (alreadyAttempted || !user) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };

    setAnswers(newAnswers);

    // Рассчет нового уровня выгорания
    const answeredDelta = Object.entries(newAnswers).reduce((sum, [id, ans]) => {
      if (!ans) return sum;
      const qId = parseInt(id);
      const q = questions.find(q => q.id === qId);
      return sum + (q?.weight || 0);
    }, 0);

    const newLevel = Math.max(0, Math.min(100, currentBurnoutLevel + answeredDelta));
    setCurrentBurnoutLevel(newLevel);

    // Проверка завершения опроса
    if (questions.every(q => q.id in newAnswers)) {
      submitSurvey(answeredDelta);
    }
  };

  // Отправка результата
  const submitSurvey = async (totalScore: number) => {
    if (!user?.id) return;

    try {
      const response = await api.submitSurvey({
        telegramId: Number(user.id),
        newScore: totalScore,
        initData
      });

      // Обработка ошибок API
      if (response.httpStatus === 429) {
        setApiError('Вы уже проходили опрос сегодня');
        setAlreadyAttempted(true);
        return;
      }

      if (!response.success) {
        setApiError(response.error || 'Ошибка сохранения результатов');
        return;
      }

      // Успешное завершение
      if (response.data) {
        setSurveyCompleted(true);
        setAlreadyAttempted(true);
        setCurrentBurnoutLevel(response.data.burnout_level);
      }
    } catch (error) {
      console.error('Survey submission failed:', error);
      setApiError('Ошибка соединения с сервером');
    }
  };

  // Отображение состояния загрузки
  if (loading) {
    return <Loader />;
  }

  // Отображение ошибок
  if (!user) {
    return (
      <div className="error-message">
        Не удалось загрузить данные пользователя. Пожалуйста, перезапустите приложение.
      </div>
    );
  }

  return (
    <div className="container">
      <BurnoutProgress level={currentBurnoutLevel} />
      <div className="content">
        {apiError && (
          <div className="error-message">{apiError}</div>
        )}

        {alreadyAttempted ? (
          <div className="time-message">
            <div className="info-message">
              Вы уже прошли опрос сегодня. Ваш текущий уровень выгорания: {currentBurnoutLevel}%
            </div>
          </div>
        ) : surveyCompleted ? (
          <div className="time-message">
            <div className="info-message">
              🎯 Тест завершен! Ваш уровень выгорания: {currentBurnoutLevel}%
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
