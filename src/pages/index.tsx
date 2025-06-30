import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import TinderCard from 'react-tinder-card';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';
import { UserProfile } from '../lib/types';
import { BurnoutProgress } from '../components/BurnoutProgress';
import Onboarding from '../components/Onboarding';
import Octagram from '../components/Octagram';

interface Question {
  id: number;
  text: string;
  weight: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Я чувствую усталость даже после отдыха",
    weight: 3
  },
  {
    id: 2,
    text: "Мне трудно сосредоточиться на работе",
    weight: 2
  },
  {
    id: 3,
    text: "Я часто чувствую раздражение",
    weight: 2
  },
  {
    id: 4,
    text: "У меня снизилась мотивация к работе",
    weight: 3
  },
  {
    id: 5,
    text: "Я испытываю физическое напряжение",
    weight: 2
  },
  {
    id: 6,
    text: "Мне сложно расслабиться",
    weight: 2
  },
  {
    id: 7,
    text: "Я чувствую себя эмоционально истощенным",
    weight: 3
  },
  {
    id: 8,
    text: "У меня есть проблемы со сном",
    weight: 2
  },
  {
    id: 9,
    text: "Я хорошо сплю",
    weight: -2
  },
  {
    id: 10,
    text: "Я чувствую себя мотивированным",
    weight: -2
  },
  {
    id: 11,
    text: "У меня хороший аппетит",
    weight: -1
  }
];

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<number, 'yes' | 'no' | 'skip'>) => void;
  questions: Question[];
}

const SurveyModal: React.FC<SurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  questions 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no' | 'skip'>>({});
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const swipeThreshold = 50;

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers({});
    }
  }, [isOpen]);

  const handleSwipe = (dir: 'left' | 'right') => {
    const answer = dir === 'right' ? 'yes' : 'no';
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: answer }));
    setSwipeDirection(dir);
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
      } else {
        onComplete(answers);
        onClose();
      }
    }, 300);
  };

  const handleSkip = () => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: 'skip' }));
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(answers);
      onClose();
    }
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;
    setDragStart({ x: point.clientX, y: point.clientY });
    setDragging(true);
  };

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragging) return;
    
    const point = 'touches' in e ? e.changedTouches[0] : e;
    const deltaX = point.clientX - dragStart.x;
    const deltaY = point.clientY - dragStart.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      handleSwipe(deltaX > 0 ? 'right' : 'left');
    }
    
    setDragging(false);
  };

  if (!isOpen || currentIndex >= questions.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Прогресс-бар */}
        <div className="h-2 bg-gray-200">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: "0%" }}
            animate={{ 
              width: `${((currentIndex + 1) / questions.length) * 100}%` 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="p-6">
          <div className="text-center mb-2 text-gray-500">
            Вопрос {currentIndex + 1} из {questions.length}
          </div>
          
          {/* Контейнер для карточки */}
          <div 
            className="relative h-64 mb-8"
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <TinderCard
              key={currentIndex}
              onSwipe={handleSwipe}
              preventSwipe={['up', 'down']}
              swipeThreshold={swipeThreshold}
              className="absolute w-full h-full"
            >
              <motion.div
                className={`w-full h-full rounded-xl shadow-lg flex items-center justify-center p-6 text-center cursor-grab
                  ${swipeDirection === 'right' ? 'bg-green-100' : 
                    swipeDirection === 'left' ? 'bg-red-100' : 'bg-white'}`}
                whileTap={{ scale: 0.98 }}
                animate={{
                  x: swipeDirection === 'right' ? 300 : swipeDirection === 'left' ? -300 : 0,
                  opacity: swipeDirection ? 0 : 1,
                  rotate: swipeDirection === 'right' ? 30 : swipeDirection === 'left' ? -30 : 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={handleSkip}
              >
                <p className="text-lg font-medium">{questions[currentIndex].text}</p>
              </motion.div>
            </TinderCard>
          </div>
          
          {/* Подсказки */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                <span className="text-red-500">←</span>
              </div>
              Нет
            </div>
            
            <div 
              className="px-4 py-2 bg-gray-100 rounded-lg cursor-pointer"
              onClick={handleSkip}
            >
              Не знаю
            </div>
            
            <div className="flex items-center">
              Да
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center ml-2">
                <span className="text-green-500">→</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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
  }, [answers, initialBurnoutLevel, surveyCompleted, userData]);

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

  const handleSurveyComplete = useCallback((answers: Record<number, 'yes' | 'no' | 'skip'>) => {
    // Рассчитываем общий балл
    const totalScore = Object.entries(answers).reduce((sum, [id, answer]) => {
      const question = QUESTIONS.find(q => q.id === parseInt(id));
      if (!question) return sum;
      
      if (answer === 'yes') return sum + question.weight;
      if (answer === 'no') return sum;
      return sum; // skip не влияет на результат
    }, 0);
    
    submitSurveyMutation.mutate(totalScore);
  }, [submitSurveyMutation]);

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
                <div className="flex justify-center mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-500 text-white px-8 py-3 rounded-xl shadow-lg font-medium"
                    onClick={() => setIsSurveyModalOpen(true)}
                  >
                    Пройти тест сегодня
                  </motion.button>
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
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        onComplete={handleSurveyComplete}
        questions={QUESTIONS}
      />
    </div>
  );
};

export default Home;
