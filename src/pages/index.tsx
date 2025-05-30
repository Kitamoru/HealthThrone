import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { BurnoutProgress } from '../components/BurnoutProgress';
import { QuestionCard } from '../components/QuestionCard';
import { Loader } from '../components/Loader';
import { api } from '../lib/api';
import { UserProfile } from '../lib/supabase'; // Импортируем тип UserProfile

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
  const { user, isReady, initData, error } = useTelegram();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [burnoutLevel, setBurnoutLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initStatus, setInitStatus] = useState<string>('not_started');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Home] Component mounted');
    
    const initializeApp = async () => {
      if (!isReady) {
        console.log('[Home] Telegram not ready yet');
        return;
      }

      try {
        console.log('[Home] Initializing application');
        setLoading(true);
        
        // 1. Инициализация пользователя
        if (initData && user?.id) {
          console.log('[Home] Initializing user with initData');
          setInitStatus('in_progress');
          
          const initResponse = await api.initUser(initData);
          console.log('[Home] User initialization response:', initResponse);
          
          if (initResponse.success) {
            setInitStatus('success');
            console.log('[Home] User initialized successfully');
          } else {
            setInitStatus('failed');
            setApiError(initResponse.error || 'Failed to initialize user');
            console.error('[Home] User initialization failed:', initResponse.error);
          }
        } else {
          console.warn('[Home] Skipping user init - missing initData or user.id');
          setInitStatus('skipped');
        }

        // 2. Загружаем вопросы
        console.log('[Home] Setting questions');
        setQuestions(QUESTIONS);
        
        // 3. Загружаем данные пользователя
        if (user?.id) {
          console.log(`[Home] Loading user data for ID: ${user.id}`);
          
          try {
            const response = await api.getUserData(user.id);
            console.log('[Home] User data response:', response);
            
            if (response.success && response.data) {
              // Явно указываем тип данных
              const userData = response.data as UserProfile;
              console.log('[Home] User data loaded:', userData);
              
              // Используем правильное поле из типа UserProfile
              setBurnoutLevel(userData.burnout_level || 0);
              
              // Загружаем предыдущие ответы если есть
              // Убрали обращение к userData.answers, так как его нет в типе
            } else {
              console.warn('[Home] No user data found or error', response.error);
            }
          } catch (err) {
            console.error('[Home] Error loading user data:', err);
          }
        } else {
          console.warn('[Home] Skipping user data load - no user ID');
        }
        
        setLoading(false);
        console.log('[Home] App initialized successfully');
      } catch (error) {
        console.error('[Home] Initialization error:', error);
        setApiError('Ошибка инициализации приложения');
        setLoading(false);
      }
    };

    initializeApp();
  }, [isReady, user, initData]);

  const handleAnswer = async (questionId: number, isPositive: boolean) => {
    console.log(`[Home] Handling answer for question ${questionId}: ${isPositive}`);
    
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      console.warn(`[Home] Question not found: ${questionId}`);
      return;
    }

    // Обновляем локальные ответы
    const newAnswers = {
      ...answers,
      [questionId]: isPositive
    };
    setAnswers(newAnswers);

    // Рассчитываем изменение уровня выгорания
    const delta = isPositive ? question.weight : 0;
    const newLevel = Math.max(0, Math.min(100, burnoutLevel + delta));
    setBurnoutLevel(newLevel);
    console.log(`[Home] New burnout level: ${newLevel}%`);

    // Отправляем данные на сервер если есть пользователь
    if (user?.id) {
      console.log(`[Home] Saving burnout level for user ${user.id}`);
      
      try {
        const saveResponse = await api.updateBurnoutLevel(user.id, newLevel);
        console.log('[Home] Save response:', saveResponse);
        
        if (!saveResponse.success) {
          console.error('[Home] Failed to save burnout level:', saveResponse.error);
        }
      } catch (error) {
        console.error('[Home] Error saving burnout level:', error);
      }
    } else {
      console.warn('[Home] Skipping save - no user ID');
    }
  };

  if (loading) {
    console.log('[Home] Rendering loader');
    return <Loader />;
  }

  const allAnswered = questions.every(q => q.id in answers);
  console.log(`[Home] All questions answered: ${allAnswered}`);

  // Диагностическая панель
  const debugInfo = {
    telegramReady: isReady,
    user: user ? {
      id: user.id,
      name: user.first_name
    } : null,
    initData: initData ? `...${initData.slice(-20)}` : null,
    initStatus,
    burnoutLevel,
    answeredQuestions: Object.keys(answers).length,
    apiError
  };

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} />
      
      <div className="content">
        {allAnswered ? (
          <div className="time-message">
            <div className="info-message">
              🎯 Тест завершен! Ваш уровень выгорания: {burnoutLevel}%
              <br />
              Попробуйте снова завтра для отслеживания динамики.
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
        <button className="menu-btn">📊</button>
        <button className="menu-btn">📈</button>
        <button className="menu-btn">⚙️</button>
        <button className="menu-btn">ℹ️</button>
      </div>
      
      {/* Диагностическая панель (только в development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: '#f0f0f0',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <h3>Debug Information:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          {error && <p style={{ color: 'red' }}>Telegram Error: {error}</p>}
          {apiError && <p style={{ color: 'red' }}>API Error: {apiError}</p>}
        </div>
      )}
    </div>
  );
}
