
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { Loader } from '@/components/Loader';
import { BurnoutProgress } from '@/components/BurnoutProgress';
import { QuestionCard } from '@/components/QuestionCard';
import type { Question } from '@/types';

const questions: Question[] = [
  {
    id: 1,
    text: "Чувствуете ли вы эмоциональное истощение на работе?",
    positive_answer: "😔 Да",
    negative_answer: "😊 Нет"
  },
  {
    id: 2,
    text: "Трудно ли вам сосредоточиться на задачах?",
    positive_answer: "😵 Да",
    negative_answer: "🎯 Нет"
  },
  {
    id: 3,
    text: "Чувствуете ли вы раздражительность или злость?",
    positive_answer: "😠 Да",
    negative_answer: "😌 Нет"
  },
  {
    id: 4,
    text: "Испытываете ли вы физическую усталость?",
    positive_answer: "🥱 Да",
    negative_answer: "💪 Нет"
  },
  {
    id: 5,
    text: "Снизилась ли ваша мотивация к работе?",
    positive_answer: "📉 Да",
    negative_answer: "📈 Нет"
  }
];

export default function Home() {
  const { user, isReady, initData, webApp } = useTelegram();
  const [burnoutLevel, setBurnoutLevel] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [canTakeSurvey, setCanTakeSurvey] = useState(true);
  const [answers, setAnswers] = useState<boolean[]>([]);

  useEffect(() => {
    if (isReady) {
      initializeApp();
    }
  }, [isReady, user]);

  const initializeApp = async () => {
    try {
      if (user && initData) {
        const response = await api.init(initData);
        if (response.success && response.data) {
          setBurnoutLevel(response.data.burnout_level);
        }
      } else {
        // Development mode
        setBurnoutLevel(5);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      webApp?.HapticFeedback.notificationOccurred('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, isPositive: boolean) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = isPositive;
    setAnswers(newAnswers);

    // Auto-submit when all questions are answered
    if (newAnswers.length === questions.length && !newAnswers.includes(undefined)) {
      submitSurvey(newAnswers);
    }
  };

  const submitSurvey = async (surveyAnswers: boolean[]) => {
    try {
      const positiveCount = surveyAnswers.filter(answer => answer).length;
      const delta = positiveCount - (questions.length - positiveCount);
      
      if (user) {
        await api.updateBurnout(user.id.toString(), delta);
        const response = await api.getUserData(user.id.toString());
        if (response.success && response.data) {
          setBurnoutLevel(response.data.burnout_level);
        }
      } else {
        // Development mode
        setBurnoutLevel(prev => Math.max(0, Math.min(10, prev + delta)));
      }

      setSurveyCompleted(true);
      setCanTakeSurvey(false);
      webApp?.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      console.error('Survey submission error:', error);
      webApp?.HapticFeedback.notificationOccurred('error');
    }
  };

  const resetSurvey = () => {
    setAnswers([]);
    setSurveyCompleted(false);
    setCanTakeSurvey(true);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <BurnoutProgress level={burnoutLevel} sprite="/sprite.gif" />
      
      <div className="content">
        <AnimatePresence mode="wait">
          {!canTakeSurvey ? (
            <motion.div
              key="completed"
              className="time-message"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <div className="info-message">
                ✅ Опрос завершен! Следующий опрос будет доступен завтра.
                <br />
                <br />
                Уровень выгорания: {burnoutLevel}/10
              </div>
              
              <motion.button
                className="answer-btn positive"
                onClick={resetSurvey}
                style={{ marginTop: '15px' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Пройти еще раз (для демо)
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="survey"
              className="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question.text}
                  positiveAnswer={question.positive_answer}
                  negativeAnswer={question.negative_answer}
                  onAnswer={(isPositive) => handleAnswer(index, isPositive)}
                  disabled={answers[index] !== undefined}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        className="menu"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.button 
          className="menu-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          📊
        </motion.button>
        <motion.button 
          className="menu-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          📝
        </motion.button>
        <motion.button 
          className="menu-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ⚙️
        </motion.button>
        <motion.button 
          className="menu-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ❓
        </motion.button>
      </motion.div>
    </div>
  );
}
