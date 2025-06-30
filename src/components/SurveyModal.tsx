import React, { useState, useEffect } from 'react';
import TinderCard, { Direction } from 'react-tinder-card';
import { motion } from 'framer-motion';

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
  const [swipeDirection, setSwipeDirection] = useState<Direction | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setSwipeDirection(null);
    }
  }, [isOpen]);

  const handleSwipe = (dir: Direction) => {
    // Обрабатываем только левый и правый свайп
    if (dir !== 'left' && dir !== 'right') return;
    
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
        {/* ... остальной код без изменений */}
        
        <div className="p-6">
          {/* ... */}
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
              onSwipe={handleSwipe} {/* Теперь тип соответствует */}
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
          
          {/* ... */}
        </div>
      </motion.div>
    </div>
  );
};
