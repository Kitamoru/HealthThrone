import React, { useState, useCallback, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { Question } from '../lib/types';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[]; // Получаем вопросы через пропсы
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
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            Тест на выгорание
          </Dialog.Title>

          {/* Прогресс-бар */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <motion.div 
              className="bg-blue-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {currentIndex} из {questions.length}
          </p>

          <div className="mt-8 flex justify-center items-center h-64">
            <AnimatePresence>
              {currentIndex < questions.length && (
                <TinderCard
                  key={currentIndex}
                  onSwipe={(dir) => handleSwipe(dir, questions[currentIndex].id)}
                  preventSwipe={['up', 'down']}
                  className="absolute w-full"
                >
                  <motion.div
                    className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-md cursor-pointer"
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
                    <p className="text-lg font-medium text-center">
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
                className="text-center"
              >
                <h3 className="text-xl font-semibold">Опрос завершен!</h3>
                <p className="mt-2">Обрабатываем результаты...</p>
              </motion.div>
            )}
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button 
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
              onClick={() => handleSwipe('left', questions[currentIndex].id)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Нет
            </button>
            <button 
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
              onClick={() => handleDontKnow(questions[currentIndex].id)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Не знаю
            </button>
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
              onClick={() => handleSwipe('right', questions[currentIndex].id)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Да
            </button>
          </div>

          {isLoading && (
            <div className="mt-4 text-center">
              <p>Сохранение результатов...</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
