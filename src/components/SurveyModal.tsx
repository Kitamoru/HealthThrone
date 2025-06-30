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
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
    >
      <motion.div 
        className="relative w-full max-w-lg max-h-[90vh] rounded-xl overflow-hidden flex flex-col z-10"
        style={{ 
          backgroundColor: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Прогресс-бар */}
        <div className="px-4 pt-4" style={{ backgroundColor: 'white' }}>
          <p className="text-center text-gray-500 mb-1">
            Вопрос {currentIndex + 1} из {questions.length}
          </p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${((currentIndex + 1) / questions.length) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Область вопроса - занимает 2/3 высоты */}
        <div 
          className="flex-[2] flex items-center justify-center p-4"
          style={{ minHeight: '50vh' }}
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
              <p className="text-xl font-medium text-gray-800 px-4">
                {questions[currentIndex].text}
              </p>
            </motion.div>
          </TinderCard>
        </div>
        
        {/* Кнопки ответов - занимают 1/3 высоты */}
        <div className="flex-[1] flex justify-between items-center p-6 pt-4" style={{ backgroundColor: 'white' }}>
          <button
            onClick={() => handleAnswer('no')}
            className="flex items-center justify-center shadow-md hover:bg-red-200 transition-colors"
            style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626'
            }}
          >
            <span className="text-2xl">←</span>
          </button>
          
          <button
            onClick={handleSkip}
            className="flex items-center justify-center shadow-md hover:bg-gray-200 transition-colors"
            style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              color: '#4b5563'
            }}
          >
            <span className="text-sm font-medium">↻</span>
          </button>
          
          <button
            onClick={() => handleAnswer('yes')}
            className="flex items-center justify-center shadow-md hover:bg-green-200 transition-colors"
            style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
              color: '#059669'
            }}
          >
            <span className="text-2xl">→</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
