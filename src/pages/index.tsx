import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { api, useOctalysisFactors } from '../lib/api';
import { Loader } from '../components/Loader';
import { UserProfile } from '../lib/types';
import { BurnoutProgress } from '../components/BurnoutProgress';
import Onboarding from '../components/Onboarding';
import Octagram from '../components/Octagram';
import { SurveyModal } from '../components/SurveyModal';
import { createPortal } from 'react-dom';

// ... (QUESTIONS array remains the same) ...

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
  
  const modalPortalRef = useRef<HTMLDivElement | null>(null);

  // Используем хук для получения факторов октализиса
  const { 
    data: octalysisFactors, 
    isLoading: isLoadingFactors,
    refetch: refetchFactors 
  } = useOctalysisFactors(user?.id ? parseInt(user.id) : undefined, initData);

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
      
      // Обновляем факторы через хук
      refetchFactors();
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
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }
    
    // ВОССТАНАВЛИВАЕМ ПРЕЖНЮЮ ЛОГИКУ
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

  // Обновлено условие: учитываем загрузку факторов
  if (isLoading || !spriteLoaded || isLoadingFactors) {
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
          <div className="scrollable-content">
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
                  {/* Добавляем ключ для принудительного пересоздания компонента */}
                  <Octagram 
                    key={JSON.stringify(octagramValues)} 
                    values={octagramValues} 
                    size={280} 
                  />
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
