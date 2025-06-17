import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';

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

const Home = () => {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const queryClient = useQueryClient();
  
  const [questions] = useState<Question[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Прелоад данных для friends и shop
  useEffect(() => {
    if (!user?.id || !initData) return;
    
    const prefetchData = async () => {
      try {
        // Прелоад данных для страницы friends
        await queryClient.prefetchQuery({
          queryKey: ['friends', user.id],
          queryFn: async () => {
            const response = await api.getFriends(user.id.toString());
            if (response.success && response.data) {
              return response.data;
            }
            throw new Error(response.error || 'Failed to prefetch friends');
          },
          staleTime: 5 * 60 * 1000,
        });

        // Прелоад данных для страницы shop
        await queryClient.prefetchQuery({
          queryKey: ['sprites'],
          queryFn: async () => {
            const response = await api.getSprites();
            if (response.success) {
              return response.data || [];
            }
            throw new Error(response.error || 'Failed to prefetch sprites');
          },
          staleTime: 10 * 60 * 1000,
        });

        // Прелоад данных о купленных спрайтах
        await queryClient.prefetchQuery({
          queryKey: ['ownedSprites', user.id],
          queryFn: async () => {
            const response = await api.getOwnedSprites(Number(user.id));
            if (response.success) {
              return response.data || [];
            }
            throw new Error(response.error || 'Failed to prefetch owned sprites');
          },
          staleTime: 5 * 60 * 1000,
        });
      } catch (error) {
        console.error('Prefetch error:', error);
      }
    };

    // Запуск прелоада с задержкой 1 секунда
    const timer = setTimeout(prefetchData, 1000);
    return () => clearTimeout(timer);
  }, [user?.id, queryClient]);

  // Проверка, является ли дата сегодняшней (в UTC)
  const isTodayUTC = useCallback((dateStr: string) => {
    const today = new Date();
    const todayUTC = [
      today.getUTCFullYear(),
      String(today.getUTCMonth() + 1).padStart(2, '0'),
      String(today.getUTCDate()).padStart(2, '0')
    ].join('-');
    
    const datePart = dateStr.split('T')[0];
    return todayUTC === datePart;
  }, []);

  // Загрузка данных пользователя
  const { 
    data: userData, 
    isLoading, 
    isError,
    error: queryError 
  } = useQuery({
    queryKey: ['userData', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await api.getUserData(Number(user.id));
      
      if (!response.success) {
        throw new Error(response.error || "Ошибка загрузки данных");
      }
      
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Обработка ошибок
  useEffect(() => {
    if (queryError) {
      setApiError(queryError.message);
    }
  }, [queryError]);

  // Мутация для отправки опроса
  const submitSurveyMutation = useMutation({
    mutationFn: async (totalScore: number) => {
      if (!user?.id) throw new Error("Пользователь не определен");
      
      const response = await api.submitSurvey({
        telegramId: Number(user.id),
        newScore: totalScore
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка сохранения результатов');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userData', user?.id], data);
      setSurveyCompleted(true);
    },
    onError: (error: Error) => {
      setApiError(error.message);
    }
  });

  // Вычисляемые значения
  const initialBurnoutLevel = userData?.burnout_level ?? 0;
  const spriteUrl = userData?.current_sprite_url || '/sprite.gif';
  const alreadyAttemptedToday = userData?.last_attempt_date 
    ? isTodayUTC(userData.last_attempt_date) 
    : false;

  // Расчет текущего уровня выгорания
  const burnoutLevel = useMemo(() => {
    const answeredDelta = Object.entries(answers).reduce((sum, [id, ans]) => {
      if (!ans) return sum;
      const qId = parseInt(id);
      const q = questions.find(q => q.id === qId);
      return sum + (q?.weight || 0);
    }, 0);

    return Math.max(0, Math.min(100, initialBurnoutLevel + answeredDelta));
  }, [answers, initialBurnoutLevel, questions]);

  // Обработка выбора ответа
  const handleAnswer = (questionId: number, isPositive: boolean) => {
    if (alreadyAttemptedToday || !user) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };

    setAnswers(newAnswers);

    // Проверка завершения опроса
    if (questions.every(q => q.id in newAnswers)) {
      const totalScore = Object.values(newAnswers).reduce((sum, ans, idx) => {
        return sum + (ans ? questions[idx].weight : 0);
      }, 0);
      
      submitSurveyMutation.mutate(totalScore);
    }
  };

  // Загрузка
  if (isLoading) {
    return <Loader />;
  }

  // Ошибки
  if (isError || !user) {
    return (
      <div className="error-message">
        {apiError || "Не удалось загрузить данные пользователя. Пожалуйста, перезапустите приложение."}
      </div>
    );
  }

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} spriteUrl={spriteUrl} />
      
      <div className="content">
        {apiError && !alreadyAttemptedToday && (
          <div className="error-message">{apiError}</div>
        )}

        {alreadyAttemptedToday ? (
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
        <Link href="/reference" passHref>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
        </Link>
      </div>
    </div>
  );
};

export default React.memo(Home);
