import React, { useState, useCallback, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { Question } from '../lib/questionTypes';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSubmit: (answers: Record<number, boolean | null>) => void;
  isLoading: boolean;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  questions,
  onSubmit,
  isLoading
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  
  // Сброс состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setDirection('none');
    }
  }, [isOpen]);

  const handleSwipe = useCallback((dir: string, id: number) => {
    const isPositive = dir === 'right';
    setDirection(dir as 'left' | 'right');
    setAnswers(prev => ({ ...prev, [id]: isPositive }));
    
    // Задержка для анимации перед переходом к следующему вопросу
    setTimeout(() => {
      setDirection('none');
      setCurrentIndex(prev => prev + 1);
    }, 300);
  }, []);

  const handleDontKnow = useCallback((id: number) => {
    setDirection('none');
    setAnswers(prev => ({ ...prev, [id]: null }));
    setCurrentIndex(prev => prev + 1);
  }, []);

  // При завершении опроса
  useEffect(() => {
    if (currentIndex === questions.length) {
      onSubmit(answers);
    }
  }, [currentIndex, questions.length, answers, onSubmit]);

  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Бэкдроп */}
      <div className="fixed inset-0 bg-black opacity-30" />
      
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="test-step inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-tg-secondary shadow-xl rounded-2xl border border-tg-border">
          <div className="progress-container">
            <div className="progress-text text-tg-hint text-sm mb-2">
              Вопрос {currentIndex + 1} из {questions.length}
            </div>
            <div className="progress-bar w-full h-2 bg-tg-secondary rounded overflow-hidden">
              <motion.div 
                className="progress-fill h-full bg-tg-accent rounded"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-tg-text mt-4"
          >
            Тест на выгорание
          </Dialog.Title>

          <div className="test-container mt-8 flex justify-center items-center min-h-[200px]">
            <AnimatePresence>
              {currentIndex < questions.length && (
                <TinderCard
                  key={currentIndex}
                  onSwipe={(dir) => handleSwipe(dir, questions[currentIndex].id)}
                  preventSwipe={['up', 'down']}
                  className="absolute w-full"
                >
                  <motion.div
                    className="w-full p-6 bg-tg-secondary border border-tg-border rounded-xl shadow-md cursor-pointer"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      rotate: direction === 'right' ? 10 : direction === 'left' ? -10 : 0,
                      x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => handleDontKnow(questions[currentIndex].id)}
                  >
                    <p className="test-text text-tg-text text-xl font-medium text-center">
                      {questions[currentIndex].text}
                    </p>
                  </motion.div>
                </TinderCard>
              )}
            </AnimatePresence>

            {currentIndex === questions.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="result-step text-center w-full"
              >
                <div className="result-header">
                  <h2 className="text-2xl font-bold text-tg-text">Опрос завершен!</h2>
                </div>
                <div className="result-card mt-4">
                  <p className="class-description text-tg-text">
                    Ваши ответы успешно сохранены. Результаты теста можно увидеть на главной странице.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="answers-container mt-8 grid grid-cols-3 gap-3">
            <button 
              className="answer-button bg-tg-secondary border border-tg-border rounded-xl py-3 px-4 text-tg-text transition-all hover:bg-tg-accent hover:bg-opacity-10"
              onClick={() => handleSwipe('left', questions[currentIndex].id)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Нет
            </button>
            <button 
              className="answer-button bg-tg-secondary border border-tg-border rounded-xl py-3 px-4 text-tg-text transition-all hover:bg-tg-accent hover:bg-opacity-10"
              onClick={() => handleDontKnow(questions[currentIndex].id)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Не знаю
            </button>
            <button 
              className="answer-button bg-tg-secondary border border-tg-border rounded-xl py-3 px-4 text-tg-text transition-all hover:bg-tg-accent hover:bg-opacity-10"
              onClick={() => handleSwipe('right', questions[currentIndex].id)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Да
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 text-center">
              <p className="text-tg-hint">Сохранение результатов...</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
