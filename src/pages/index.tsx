import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';
import { UserProfile } from '../lib/types';
import { BurnoutProgress } from '../components/BurnoutProgress';
import Onboarding from '../components/Onboarding';
import Octagram from '../components/Octagram';
import { SurveyModal } from '../components/SurveyModal';
import { Question } from '../lib/types';

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

const Home = () => {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const queryClient = useQueryClient();

  const [questions] = useState<Question[]>(QUESTIONS);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [isSurveySubmitting, setIsSurveySubmitting] = useState(false);

  const isTodayUTC = useCallback((dateStr: string) => {
    if (!dateStr) return false;
    
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      return (
        date.getUTCFullYear() === now.getUTCFullYear() &&
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCDate() === now.getUTCDate()
      );
    } catch (e) {
      console.error('Date parsing error:', e);
      return false;
    }
  }, []);

  const { 
    data: userData, 
    isLoading, 
    isError,
    error: queryError,
    refetch: refetchUserData
  } = useQuery<UserProfile | null>({
    queryKey: ['userData', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      
      const response = await api.getUserData(Number(user.id), initData);
      
      if (!response.success) {
        throw new Error(response.error || "Ошибка загрузки данных");
      }
      
      return response.data as UserProfile;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  // Определяем необходимость онбординга
  const needsOnboarding = userData?.character_class === null;

  useEffect(() => {
    if (queryError) {
      setApiError((queryError as Error).message);
    }
  }, [queryError]);

  useEffect(() => {
    if (user?.id) {
      refetchUserData();
    }
  }, [user?.id, refetchUserData]);

  useEffect(() => {
    if (userData?.current_sprite_url) {
      const img = new Image();
      img.src = userData.current_sprite_url;
      img.onload = () => setSpriteLoaded(true);
      img.onerror = () => {
        console.error('Failed to preload sprite');
        setSpriteLoaded(true);
      };
    } else {
      setSpriteLoaded(true);
    }
  }, [userData?.current_sprite_url]);

  const submitSurveyMutation = useMutation({
    mutationFn: async (totalScore: number) => {
      if (!user?.id) throw new Error("Пользователь не определен");
      
      const response = await api.submitSurvey({
        telegramId: Number(user.id),
        newScore: totalScore,
        initData
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка сохранения результатов');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userData', user?.id], (oldData: any) => {
        if (!oldData) return data;
        
        return {
          ...oldData,
          ...data,
          current_sprite_url: oldData.current_sprite_url
        };
      });
      
      setSurveyCompleted(true);
    },
    onError: (error: Error) => {
      setApiError(error.message);
    }
  });

  const handleSurveyComplete = useCallback(async (answers: Record<number, boolean | null>) => {
    setIsSurveySubmitting(true);
    
    try {
      // Рассчитываем общий балл
      const totalScore = Object.entries(answers).reduce((sum, [id, ans]) => {
        const questionId = parseInt(id);
        const question = questions.find(q => q.id === questionId);
        
        if (!question) return sum;
        
        // Для ответа "Да" добавляем вес, для "Нет" - 0, для "Не знаю" - половину веса
        return sum + (
          ans === true ? question.weight : 
          ans === false ? 0 : 
          question.weight / 2
        );
      }, 0);
      
      // Отправляем результаты
      await submitSurveyMutation.mutateAsync(Math.round(totalScore));
      
      // Закрываем модальное окно после успешной отправки
      setIsSurveyOpen(false);
    } catch (error) {
      console.error('Ошибка при сохранении опроса:', error);
      setApiError('Ошибка при сохранении результатов');
    } finally {
      setIsSurveySubmitting(false);
    }
  }, [submitSurveyMutation, questions]);

  const initialBurnoutLevel = userData?.burnout_level ?? 0;
  const spriteUrl = userData?.current_sprite_url || '/sprite.gif';
  const alreadyAttemptedToday = userData?.last_attempt_date 
    ? isTodayUTC(userData.last_attempt_date) 
    : false;

  const burnoutLevel = useMemo(() => {
    if (surveyCompleted && userData) {
      return userData.burnout_level;
    }
    return initialBurnoutLevel;
  }, [initialBurnoutLevel, surveyCompleted, userData]);

  const octagramValues = useMemo(() => {
    return [
      -1.0, // Техномантия
      -1.0, // Артефакты
      -1.0,  // Эфирные потоки
      -1.0, // Рунная связь
      -1.0, // Киберчары
      -1.0,  // Некросеть
      -1.0,  // Астрал
      -1.0  // Квантовое колдовство
    ];
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setIsGlobalLoading(true);
    refetchUserData().finally(() => {
      setIsGlobalLoading(false);
    });
  }, [refetchUserData]);

  // Приоритет 1: Глобальная загрузка
  if (isGlobalLoading) {
    return <Loader />;
  }

  // Приоритет 2: Онбординг
  if (needsOnboarding) {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete} 
        userId={user?.id ? parseInt(user.id) : undefined}
        initData={initData}
      />
    );
  }

  // Приоритет 3: Загрузка данных или спрайта
  if (isLoading || !spriteLoaded) {
    return <Loader />;
  }

  // Приоритет 4: Главная страница
  return (
    <div className="container">
      {isError || !user ? (
        <div className="error-message">
          {apiError || "Не удалось загрузить данные пользователя. Пожалуйста, перезапустите приложение."}
        </div>
      ) : (
        <>
          <div className="scrollable-content">
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
                <div className="flex justify-center mt-8">
                  <button 
                    onClick={() => setIsSurveyOpen(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
                  >
                    Пройти тест на выгорание
                  </button>
                </div>
              )}

              {/* Блок с октаграммой */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mt-4 mb-4 flex flex-col items-center octagram-container"
                >
                  <Octagram values={octagramValues} size={280} />
                </motion.div>
              </AnimatePresence>
            </div>
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
            <Link href="/reference" passHref>
              <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>ℹ️</button>
            </Link>
          </div>
        </>
      )}

      <SurveyModal
        isOpen={isSurveyOpen}
        onClose={() => !isSurveySubmitting && setIsSurveyOpen(false)}
        questions={QUESTIONS}
        onSubmit={handleSurveyComplete}
        isLoading={isSurveySubmitting}
      />
    </div>
  );
};

export default Home;
