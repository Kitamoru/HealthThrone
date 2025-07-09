import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { createPortal } from 'react-dom';
import BottomMenu from '../components/BottomMenu';

interface Question {
  id: number;
  text: string;
  weight: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Сумели ли вы сегодня удержаться на ногах под натиском тьмы подземелья?",
    weight: 2
  },
  {
    id: 2,
    text: "Хватило ли вашей выносливости в сегодняшнем штурме подземелья?",
    weight: 2
  },
  {
    id: 3,
    text: "Ощущали ли вы сегодня, что служите великой цели гильдии, а не просто выполняете команды гильдмастера?",
    weight: 1
  },
  {
    id: 4,
    text: "Смогли ли вы сегодня продвинуться в мастерстве или заслужить знак признания от других героев?",
    weight: 1
  },
  {
    id: 5,
    text: "Получилось ли сегодня проявить инициативу или получить полезный совет от союзников?",
    weight: 1
  },
  {
    id: 6,
    text: "Чувствовали ли вы сегодня, что сами держите штурвал своего корабля, а не ведомы чужой волей?",
    weight: 1
  },
  {
    id: 7,
    text: "Поддерживали ли союзники ваш дух сегодня в этом походе?",
    weight: 1
  },
  {
    id: 8,
    text: "Придавали ли вам энергии сегодня редкие ресурсы или срочные вызовы?",
    weight: 1
  },
  {
    id: 9,
    text: "Преподнесло ли вам подземелье сегодня неожиданную встречу, загадку или событие, что пробудило интерес?",
    weight: 1
  },
  {
    id: 10,
    text: "Ощущали ли вы сегодня, что промедление может стоить вам важного шанса или артефакта?",
    weight: 1
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
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [octalysisFactors, setOctalysisFactors] = useState<number[] | null>(null);
  
  const modalPortalRef = useRef<HTMLDivElement | null>(null);

  const handleOpenSurveyModal = useCallback(() => {
    if (!modalPortalRef.current) {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'modal-portal';
      portalContainer.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
      document.body.appendChild(portalContainer);
      modalPortalRef.current = portalContainer;
    }
    setIsSurveyModalOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      if (modalPortalRef.current) {
        document.body.removeChild(modalPortalRef.current);
        modalPortalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isSurveyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isSurveyModalOpen]);

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

  // Загрузка факторов для октаграммы
  useEffect(() => {
    if (userData?.id) {
      const fetchFactors = async () => {
        const response = await api.getOctalysisFactors(userData.id, initData);
        if (response.success && response.data) {
          setOctalysisFactors(response.data);
        } else {
          console.error('Failed to load factors:', response.error);
          setOctalysisFactors([0, 0, 0, 0, 0, 0, 0, 0]);
        }
      };
      fetchFactors();
    }
  }, [userData?.id, initData]);

  const submitSurveyMutation = useMutation({
    mutationFn: async (data: { burnoutDelta: number; factors: number[] }) => {
      if (!user?.id) throw new Error("Пользователь не определен");
      
      const response = await api.submitSurvey({
        telegramId: Number(user.id),
        burnoutDelta: data.burnoutDelta,
        factors: data.factors,
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
      
      // Обновляем факторы после успешного прохождения опроса
      if (userData?.id) {
        const fetchFactors = async () => {
          const response = await api.getOctalysisFactors(userData.id, initData);
          if (response.success && response.data) {
            setOctalysisFactors(response.data);
          }
        };
        fetchFactors();
      }
    },
    onError: (error: Error) => {
      setApiError(error.message);
    }
  });

  const initialBurnoutLevel = userData?.burnout_level ?? 100; // Начинаем с 100%
  const spriteUrl = userData?.current_sprite_url || '/sprite.gif';
  const alreadyAttemptedToday = userData?.last_attempt_date 
    ? isTodayUTC(userData.last_attempt_date) 
    : false;

  const burnoutLevel = useMemo(() => {
    if (surveyCompleted && userData) {
      return userData.burnout_level;
    }

    // Рассчитываем только по вопросам 1 и 2
    const answeredDelta = [1, 2].reduce((sum, id) => {
      const answer = answers[id];
      if (answer === true) return sum + 2;
      if (answer === false) return sum - 2;
      return sum;
    }, 0);

    return Math.max(0, Math.min(100, initialBurnoutLevel + answeredDelta));
  }, [answers, initialBurnoutLevel, surveyCompleted, userData]);

  const octagramValues = useMemo(() => {
    if (!octalysisFactors) {
      return [-1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0];
    }
    return octalysisFactors.map(factor => {
      const normalized = factor / 30;
      return Math.max(0, Math.min(1, normalized)); // Ограничиваем 0-1
    });
  }, [octalysisFactors]);

  const handleSurveyComplete = useCallback((answers: Record<number, 'yes' | 'no' | 'skip'>) => {
    // Рассчитываем burnoutDelta только по первым двум вопросам
    const burnoutDelta = [1, 2].reduce((sum, id) => {
      const answer = answers[id];
      if (answer === 'yes') return sum + 2;
      if (answer === 'no') return sum - 2;
      return sum;
    }, 0);

    // Формируем массив факторов для вопросов 3-10
    const factors = [3, 4, 5, 6, 7, 8, 9, 10].map(id => {
      const answer = answers[id];
      if (answer === 'yes') return 1;
      if (answer === 'no') return -1;
      return 0; // Для 'skip'
    });

    submitSurveyMutation.mutate({ burnoutDelta, factors });
  }, [submitSurveyMutation]);

  const handleOnboardingComplete = useCallback(() => {
    setIsGlobalLoading(true);
    refetchUserData().finally(() => {
      setIsGlobalLoading(false);
    });
  }, [refetchUserData]);

  const handleCloseModal = useCallback(() => {
    setIsSurveyModalOpen(false);
  }, []);

  if (isGlobalLoading) {
    return <Loader />;
  }

  if (needsOnboarding) {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete} 
        userId={user?.id ? parseInt(user.id) : undefined}
        initData={initData}
      />
    );
  }

  // Показываем лоадер, пока не загружены данные пользователя, спрайт или факторы
  if (isLoading || !spriteLoaded === null) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
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
                    Вы уже прошли испытание сегодня. Ваш текущий уровень здоровья: {burnoutLevel}%
                  </div>
                </div>
              ) : surveyCompleted ? (
                <div className="time-message">
                  <div className="info-message">
                    🎯 Испытание завершено! Ваш уровень здоровья: {burnoutLevel}%
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}    
                    className="accept-button"
                    onClick={handleOpenSurveyModal}        
                  >
                    Пройти ежедневное испытание
                  </motion.button>
                </div>
              )}

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
          </>
        )}
      </div>

      {!needsOnboarding && <BottomMenu />}

      {modalPortalRef.current && isSurveyModalOpen && createPortal(
        <SurveyModal
          isOpen={isSurveyModalOpen}
          onClose={handleCloseModal}
          onComplete={handleSurveyComplete}
          questions={QUESTIONS}
        />,
        modalPortalRef.current
      )}
    </div>
  );
};

export default Home;
