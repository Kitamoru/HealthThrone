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

  // Используем более гибкий тип для обработки всех направлений
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
