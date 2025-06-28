import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';
import { UserProfile } from '../lib/types';
import { QuestionCard } from '../components/QuestionCard'; 
import { BurnoutProgress } from '../components/BurnoutProgress';
import Onboarding from '../components/Onboarding';

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
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false); // Единое состояние для глобального лоадера

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

  useEffect(() => {
    if (userData && userData.character_class === null) {
      setShowOnboarding(true);
    }
  }, [userData]);

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
      setAnswers({});
    },
    onError: (error: Error) => {
      setApiError(error.message);
    }
  });

  const initialBurnoutLevel = userData?.burnout_level ?? 0;
  const spriteUrl = userData?.current_sprite_url || '/sprite.gif';
  const alreadyAttemptedToday = userData?.last_attempt_date 
    ? isTodayUTC(userData.last_attempt_date) 
    : false;

  const burnoutLevel = useMemo(() => {
    if (surveyCompleted && userData) {
      return userData.burnout_level;
    }

    const answeredDelta = Object.entries(answers).reduce((sum, [id, ans]) => {
      if (!ans) return sum;
      const qId = parseInt(id);
      const q = questions.find(q => q.id === qId);
      return sum + (q?.weight || 0);
    }, 0);

    return Math.max(0, Math.min(100, initialBurnoutLevel + answeredDelta));
  }, [answers, initialBurnoutLevel, questions, surveyCompleted, userData]);

  const handleAnswer = (questionId: number, isPositive: boolean) => {
    if (alreadyAttemptedToday || !user) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };

    setAnswers(newAnswers);

    if (questions.every(q => q.id in newAnswers)) {
      const totalScore = Object.values(newAnswers).reduce((sum, ans, idx) => {
        return sum + (ans ? questions[idx].weight : 0);
      }, 0);
      
      submitSurveyMutation.mutate(totalScore);
    }
  };

  const handleOnboardingComplete = useCallback(() => {
    setIsGlobalLoading(true);
    refetchUserData().finally(() => {
      setShowOnboarding(false);
      setIsGlobalLoading(false);
    });
  }, [refetchUserData]);

  // Если идет глобальная загрузка, показываем лоадер
  if (isGlobalLoading) {
    return <Loader />;
  }

  // Показываем онбординг если требуется
  if (showOnboarding) {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete} 
        userId={user?.id ? parseInt(user.id) : undefined}
        initData={initData}
      />
    );
  }

  // Показываем лоадер при загрузке данных или спрайта
  if (isLoading || !spriteLoaded) {
    return <Loader />;
  }

  return (
    <div className="container">
      {isError || !user ? (
        <div className="error-message">
          {apiError || "Не удалось загрузить данные пользователя. Пожалуйста, перезапустите приложение."}
        </div>
      ) : (
        <>
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
    </div>
  );
};
export default Home;
