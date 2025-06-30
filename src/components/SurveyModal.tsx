import React, { useState, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { motion } from 'framer-motion';

type Direction = 'left' | 'right' | 'up' | 'down';

interface Question {
  id: number;
  text: string;
  weight: number;
}

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<number, 'yes' | 'no' | 'skip'>) => void;
  questions: Question[];
}

const swipeThreshold = 50;

export const SurveyModal: React.FC<SurveyModalProps> = ({ 
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

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setSwipeDirection(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSwipe = (dir: Direction) => {
    if (dir === 'left' || dir === 'right') {
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
    }
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

  const handleAnswer = (answer: 'yes' | 'no') => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: answer }));
    setSwipeDirection(answer === 'yes' ? 'right' : 'left');

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

  if (!isOpen || currentIndex >= questions.length) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black bg-opacity-70"
    >
      {/* Модальное окно */}
      <motion.div 
        className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-xl overflow-hidden flex flex-col z-10 shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Прогресс-бар */}
        <div className="progress-container px-4 pt-4">
          <p className="progress-text text-center text-gray-500 mb-1">
            Вопрос {currentIndex + 1} из {questions.length}
          </p>
          <div className="progress-bar h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="progress-fill h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${((currentIndex + 1) / questions.length) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Область вопроса (3/4 экрана) */}
        <div 
          className="flex-1 flex items-center justify-center p-4 min-h-[50vh]"
          onTouchStart={(e) => setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={(e) => {
            const point = e.changedTouches[0];
            const deltaX = point.clientX - dragStart.x;
            if (Math.abs(deltaX) > swipeThreshold) {
              handleSwipe(deltaX > 0 ? 'right' : 'left');
            }
          }}
        >
          <TinderCard
            key={currentIndex}
            onSwipe={handleSwipe}
            preventSwipe={['up', 'down']}
            swipeThreshold={swipeThreshold}
            className="w-full h-full"
          >
            <motion.div
              className={`w-full h-full rounded-xl flex items-center justify-center p-6 text-center cursor-grab
                ${swipeDirection === 'right' ? 'bg-green-50' : 
                  swipeDirection === 'left' ? 'bg-red-50' : 'bg-white'}`}
              whileTap={{ scale: 0.98 }}
              animate={{
                x: swipeDirection === 'right' ? '100vw' : swipeDirection === 'left' ? '-100vw' : 0,
                opacity: swipeDirection ? 0 : 1,
                rotate: swipeDirection === 'right' ? 30 : swipeDirection === 'left' ? -30 : 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <p className="text-xl font-medium text-gray-800">
                {questions[currentIndex].text}
              </p>
            </motion.div>
          </TinderCard>
        </div>
        
        {/* Кнопки ответов (нижняя 1/4 экрана) */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <button
            onClick={() => handleAnswer('no')}
            className="control-button bg-red-100 text-red-600 px-4 py-2 rounded-lg"
          >
            <div className="flex items-center">
              <span className="mr-2">←</span> Нет
            </div>
          </button>
          
          <button
            onClick={handleSkip}
            className="control-button bg-gray-100 text-gray-600 px-4 py-2 rounded-lg"
          >
            Пропустить
          </button>
          
          <button
            onClick={() => handleAnswer('yes')}
            className="control-button bg-green-100 text-green-600 px-4 py-2 rounded-lg"
          >
            <div className="flex items-center">
              Да <span className="ml-2">→</span>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
