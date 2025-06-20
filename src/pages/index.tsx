import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

// Динамические импорты
const BurnoutProgress = dynamic(
  () => import('../components/BurnoutProgress').then(mod => mod.BurnoutProgress),
  { 
    loading: () => <div className="sprite-container">Загрузка...</div>,
    ssr: false
  }
);

const OctalisysChart = dynamic(
  () => import('../components/OctalisysChart').then(mod => mod.OctalisysChart),
  { 
    loading: () => <div>Загрузка Октализа...</div>,
    ssr: false
  }
);

const DailyCheckupModal = dynamic(
  () => import('../components/DailyCheckupModal').then(mod => mod.DailyCheckupModal),
  {
    loading: () => <div>Загрузка опроса...</div>,
    ssr: false
  }
);

// Константы факторов Октализа
const OCTALYSIS_FACTORS = [
  "Смысл", "Мастерство", "Автономия", "Влияние",
  "Социальность", "Неопределенность", "Редкость", "Избегание"
];

// Вопросы для чекапа
const BURNOUT_QUESTIONS = [
  {
    id: 1,
    text: "Я чувствую усталость даже после отдыха",
    weight: 3
  },
  {
    id: 2,
    text: "Мне трудно сосредоточиться на работе",
    weight: 2
  }
];

const OCTALYSIS_QUESTIONS = [
  {
    id: 3,
    text: "Я вижу смысл в том, что делаю",
    factor: 0,
    weight: 2
  },
  {
    id: 4,
    text: "Я чувствую, что совершенствую свои навыки",
    factor: 1,
    weight: 2
  },
  {
    id: 5,
    text: "У меня есть свобода в выборе как выполнять задачи",
    factor: 2,
    weight: 3
  },
  {
    id: 6,
    text: "Я вижу как мои действия влияют на результат",
    factor: 3,
    weight: 2
  },
  {
    id: 7,
    text: "Я чувствую связь с коллегами/друзьями",
    factor: 4,
    weight: 2
  },
  {
    id: 8,
    text: "Мне интересны новые неопределенные задачи",
    factor: 5,
    weight: 3
  },
  {
    id: 9,
    text: "Я ценю редкие возможности, которые мне предоставляются",
    factor: 6,
    weight: 2
  },
  {
    id: 10,
    text: "Я стараюсь избегать негативных ситуаций",
    factor: 7,
    weight: 2
  }
];

const Home = () => {
  const router = useRouter();
  const { user, initData } = useTelegram();
  const queryClient = useQueryClient();
  
  const [showCheckup, setShowCheckup] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Функция проверки даты
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
  } = useQuery({
    queryKey: ['userData', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await api.getUserData(Number(user.id), initData);
      
      if (!response.success) {
        throw new Error(response.error || "Ошибка загрузки данных");
      }
      
      return response.data;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (queryError) {
      setApiError(queryError.message);
    }
  }, [queryError]);

  useEffect(() => {
    if (user?.id) {
      refetchUserData();
    }
  }, [user?.id, refetchUserData]);

  // Предзагрузка спрайта
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
    mutationFn: async ({ burnoutDelta, factorsDelta }: { 
      burnoutDelta: number; 
      factorsDelta: number[] 
    }) => {
      if (!user?.id) throw new Error("Пользователь не определен");
      
      const response = await api.submitSurvey({
        telegramId: Number(user.id),
        burnoutDelta,
        factorsDelta,
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
    },
    onError: (error: Error) => {
      setApiError(error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const initialBurnoutLevel = userData?.burnout_level ?? 0;
  const spriteUrl = userData?.current_sprite_url || '/sprite.gif';
  const alreadyAttemptedToday = userData?.last_attempt_date 
    ? isTodayUTC(userData.last_attempt_date) 
    : false;

  // Получаем факторы Октализа
  const octalysisFactors = useMemo(() => {
    if (userData?.octalysis_factors) {
      return userData.octalysis_factors;
    }
    // Значения по умолчанию
    return [50, 50, 50, 50, 50, 50, 50, 50];
  }, [userData]);

  const handleCompleteCheckup = useCallback((burnoutDelta: number, factorsDelta: number[]) => {
    setIsSubmitting(true);
    submitSurveyMutation.mutate({ burnoutDelta, factorsDelta });
    setShowCheckup(false);
  }, [submitSurveyMutation]);

  if (isLoading || !spriteLoaded) {
    return <Loader />;
  }

  if (isError || !user) {
    return (
      <div className="error-message">
        {apiError || "Не удалось загрузить данные пользователя. Пожалуйста, перезапустите приложение."}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="character-section">
        <BurnoutProgress level={initialBurnoutLevel} spriteUrl={spriteUrl} />
      </div>

      <div className="octalysis-section">
        <h3 className="section-title">Моя мотивация</h3>
        <OctalisysChart factors={octalysisFactors} factorNames={OCTALYSIS_FACTORS} />
      </div>

      <div className="actions-section">
        <AnimatePresence>
          {apiError && !alreadyAttemptedToday && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        {alreadyAttemptedToday ? (
          <div className="info-card">
            <div className="info-icon">✅</div>
            <div className="info-content">
              <h4>Уже прошли сегодня</h4>
              <p>Ваш текущий уровень выгорания: {initialBurnoutLevel}%</p>
              <p>Следующий чекап будет доступен завтра</p>
            </div>
          </div>
        ) : (
          <motion.button
            className="checkup-button"
            onClick={() => setShowCheckup(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Обработка...</span>
            ) : (
              <>
                <span>Пройти ежедневный чекап</span>
                <span className="pulse-animation"></span>
              </>
            )}
          </motion.button>
        )}
      </div>

      <div className="menu">
        <Link href="/" passHref>
          <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>
            <span className="icon">📊</span>
            <span className="label">Статистика</span>
          </button>
        </Link>
        <Link href="/friends" passHref>
          <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
            <span className="icon">👥</span>
            <span className="label">Друзья</span>
          </button>
        </Link>
        <Link href="/shop" passHref>
          <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>
            <span className="icon">🛍️</span>
            <span className="label">Магазин</span>
          </button>
        </Link>
        <Link href="/reference" passHref>
          <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>
            <span className="icon">ℹ️</span>
            <span className="label">Справка</span>
          </button>
        </Link>
      </div>

      {showCheckup && (
        <DailyCheckupModal
          burnoutQuestions={BURNOUT_QUESTIONS}
          octalysisQuestions={OCTALYSIS_QUESTIONS}
          onClose={() => setShowCheckup(false)}
          onComplete={handleCompleteCheckup}
        />
      )}
    </div>
  );
};

export default React.memo(Home);
