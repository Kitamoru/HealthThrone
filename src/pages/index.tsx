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
import Onboarding from '../components/Onboarding';
import Octagram from '../components/Octagram';
import { SurveyModal } from '../components/SurveyModal';
import { createPortal } from 'react-dom';
import BottomMenu from '../components/BottomMenu';
import CharacterSprite from '../components/CharacterSprite';
import BurnoutBlock from '../components/BurnoutBlock';
import { getClassDescription } from '../lib/characterHelper';

interface Question {
  id: number;
  text: string;
  weight: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Сумели ли вы сегодня удержаться на ногах под натиском тёмных сил?",
    weight: 2
  },
  {
    id: 2,
    text: "Чувствовали ли вы сегодня, что пламя в вашей душе горит ярко, а свершения наполняют вас радостью?",
    weight: 2
  },
  {
    id: 3,
    text: "Ощущали ли вы сегодня, что служите великой цели гильдии, а не просто выполняете команды гильдмастера?",
    weight: 1
  },
  {
    id: 4,
    text: "Чувствовали ли вы сегодня, что сами держите штурвал своего корабля, а не ведомы чужой волей?",
    weight: 1
  },
  {
    id: 5,
    text: "Чувствовали ли вы сегодня, что ваш голос или действия повлияли на решения или дух отряда?",
    weight: 1
  },
  {
    id: 6,
    text: "Преподнес ли сегодняшний день неожиданную встречу, загадку или событие, что пробудило Ваш интерес?",
    weight: 1
  },
  {
    id: 7,
    text: "Помогло ли вам сегодня ощущение, что промедление может стоить вам важного шанса или артефакта?",
    weight: 1
  },
  {
    id: 8,
    text: "Придавали ли вам энергии сегодня редкие ресурсы или срочные вызовы?",
    weight: 1
  },
  {
    id: 9,
    text: "Удалось ли вам сегодня завладеть новым ценным трофеем, артефактом, или знанием, усиливающим вашу мощь?",
    weight: 1
  },
  {
    id: 10,
    text: "Смогли ли вы сегодня продвинуться в мастерстве или заслужить признание от других героев?",
    weight: 1
  }
];

const Home = () => {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const queryClient = useQueryClient();
  const [questions] = useState<Question[]>(QUESTIONS);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [octalysisFactors, setOctalysisFactors] = useState<number[] | null>(null);
  const [octagramSize, setOctagramSize] = useState(280);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  
  const modalPortalRef = useRef<HTMLDivElement | null>(null);
// НОВЫЙ ОБРАБОТЧИК КНОПКИ "СОВЕТ МУДРЕЦА"
  const handleGetAiAdvice = useCallback(async () => {
  if (!user?.id) return;

  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await response.json();
    setAiAdvice(data.advice);
  } catch (error) {
    setAiAdvice("Ошибка связи с Мудрецом.");
  } finally {
    setIsAiLoading(false);
  }
}, [user?.id]);
  // Адаптивный размер октаграммы
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 400) {
        setOctagramSize(220);
      } else if (window.innerWidth < 768) {
        setOctagramSize(250);
      } else {
        setOctagramSize(280);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleOpenSurveyModal = useCallback(() => {
    // Генерируем новый порядок вопросов при каждом открытии
    const firstTwo = QUESTIONS.slice(0, 2); // Фиксируем первые два вопроса
    const rest = QUESTIONS.slice(2);
    const shuffledRest = [...rest].sort(() => Math.random() - 0.5);
    setShuffledQuestions([...firstTwo, ...shuffledRest]);

    if (!modalPortalRef.current) {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'modal-portal';
      portalContainer.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
      document.body.appendChild(portalContainer);
      modalPortalRef.current = portalContainer;
    }
    setIsSurveyModalOpen(true);
  }, []);

  const handleOctalysisInfo = useCallback(() => {
    alert("Добро пожаловать, герой!\n\nТы вступаешь в мир, где каждая задача — это квест, а твоя воля и страсть определят судьбу великих свершений.\nВосемь путеводных звёзд вдохновят тебя на подвиги. Если звезда тускнеет, следуй их советам, чтобы вновь зажечь пламя!\n\nИди вперёд, герой, и пусть звёзды карты мотивации освещают твой путь к величию!");
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

  // ОБРАБОТЧИК КЛИКА ПО КЛАССУ ПЕРСОНАЖА (ПЕРЕМЕЩЕН ПОСЛЕ useQuery)
  const handleClassClick = useCallback(() => {
    if (userData?.character_class) {
      const description = getClassDescription(userData.character_class);
      alert(description);
    }
  }, [userData?.character_class]);

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

  const initialBurnoutLevel = userData?.burnout_level ?? 100;
  const spriteUrl = userData?.current_sprite_url || '/IMG_0476.png';
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
      return Math.max(0, Math.min(1, normalized));
    });
  }, [octalysisFactors]);

  const handleSurveyComplete = useCallback((answers: Record<number, 'yes' | 'no' | 'skip'>) => {
    const burnoutDelta = [1, 2].reduce((sum, id) => {
      const answer = answers[id];
      if (answer === 'yes') return sum + 2;
      if (answer === 'no') return sum - 2;
      return sum;
    }, 0);

    // Формируем factors в порядке исходных вопросов (3-10)
    const factors = [3, 4, 5, 6, 7, 8, 9, 10].map(id => {
      const answer = answers[id];
      if (answer === 'yes') return 1;
      if (answer === 'no') return -1;
      return 0;
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

  if (isLoading || !spriteLoaded) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="scrollable-content">
        <div className="new-header">
          <div 
            className="header-content"
            onClick={handleClassClick}
            style={{ cursor: userData?.character_class ? 'pointer' : 'default' }}
          >
            {userData?.character_class || 'Ваш класс'}
          </div>
        </div>

        {isError || !user ? (
          <div className="error-message">
            {apiError || "Не удалось загрузить данные пользователя.\n\nПожалуйста, перезапустите приложение."}
          </div>
        ) : (
          <>
            <CharacterSprite spriteUrl={spriteUrl} />
            
            <div className="burnout-and-button-container">
              <BurnoutBlock level={burnoutLevel} />
              
              <div className="content">
                {apiError && !alreadyAttemptedToday && (
                  <div className="error-message">{apiError}</div>
                )}

                {alreadyAttemptedToday ? (
                  <div className="time-message">
                    <div className="info-message">
                      Герой, сегодня ты прошел испытание. Возвращайся завтра.
                    </div>
                  </div>
             ) : surveyCompleted ? (
                 <div className="time-message">
                    <div className="info-message">
                      Испытание завершено! Ваш уровень здоровья: {burnoutLevel}%
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center w-full">
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
              </div>
            </div>

        <div className="octagram-container">
          <div className="octagram-wrapper">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full h-full flex justify-center items-center"
              >
                <Octagram values={octagramValues} />
              </motion.div>
            </AnimatePresence>
          </div>
              
              <button 
                className="octalysis-info-button"
                onClick={handleOctalysisInfo}
              >
                Как работает карта мотивации?
              </button>
          {/* !!! ВОТ ЗДЕСЬ НУЖНО ВСТАВИТЬ КНОПКУ !!! */}
          <button
            className="octalysis-ai-button" // Добавьте этот класс в ваш CSS
            onClick={handleGetAiAdvice}
            disabled={!user?.id}
            style={{ marginTop: '10px' }} // Добавляем отступ от верхней кнопки
          >
            📜 Совет мудреца
          </button>
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
          questions={shuffledQuestions}
        />,
        modalPortalRef.current
      )}
    </div>
  );
};

export default Home;
