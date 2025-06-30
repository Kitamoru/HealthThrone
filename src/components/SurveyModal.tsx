import React, { useState, useEffect, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';

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
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setSwipeDirection(null);
      return;
    }

    // Создаем элемент для портала
    const portalElement = document.createElement('div');
    portalElement.id = 'survey-modal-portal';
    portalElement.style.position = 'fixed';
    portalElement.style.top = '0';
    portalElement.style.left = '0';
    portalElement.style.right = '0';
    portalElement.style.bottom = '0';
    portalElement.style.zIndex = '1000';
    portalElement.style.pointerEvents = 'auto';
    
    document.body.appendChild(portalElement);
    portalRef.current = portalElement;

    // Блокируем скролл основного контента
    document.body.style.overflow = 'hidden';

    return () => {
      if (portalRef.current) {
        document.body.removeChild(portalRef.current);
        portalRef.current = null;
      }
      // Восстанавливаем скролл
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSwipe = (dir: Direction) => {
    if (dir === 'left' || dir === 'right') {
      const answer = dir === 'right' ? 'yes' : 'no';
      const newAnswers = {...answers, [questions[currentIndex].id]: answer};
      setAnswers(newAnswers);
      setSwipeDirection(dir);

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setSwipeDirection(null);
        } else {
          onComplete(newAnswers);
          onClose();
        }
      }, 300);
    }
  };

  const handleSkip = () => {
    const newAnswers = {...answers, [questions[currentIndex].id]: 'skip'};
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(newAnswers);
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

  return portalRef.current ? (
    ReactDOM.createPortal(
      <AnimatePresence>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <motion.div 
            className="bg-white w-full h-full flex flex-col"
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
            
            <div className="flex-1 flex flex-col p-4">
              <div className="text-center mb-4 text-gray-500 text-lg">
                Вопрос {currentIndex + 1} из {questions.length}
              </div>
              
              {/* Контейнер для карточки */}
              <div 
                className="flex-1 relative mb-6"
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
                  className="absolute inset-0"
                >
                  <motion.div
                    className={`w-full h-full rounded-xl shadow-lg flex items-center justify-center p-6 text-center cursor-grab
                      ${swipeDirection === 'right' ? 'bg-green-100' : 
                        swipeDirection === 'left' ? 'bg-red-100' : 'bg-white'}`}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      x: swipeDirection === 'right' ? '100vw' : swipeDirection === 'left' ? '-100vw' : 0,
                      opacity: swipeDirection ? 0 : 1,
                      rotate: swipeDirection === 'right' ? 30 : swipeDirection === 'left' ? -30 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <p className="text-xl font-medium">{questions[currentIndex].text}</p>
                  </motion.div>
                </TinderCard>
              </div>
              
              {/* Подсказки */}
              <div className="flex justify-between items-center text-base text-gray-500 pb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-2">
                    <span className="text-red-500 text-xl">←</span>
                  </div>
                  <span className="hidden sm:inline">Нет</span>
                </div>
                
                <div 
                  className="px-5 py-3 bg-gray-100 rounded-lg cursor-pointer text-base"
                  onClick={handleSkip}
                >
                  Не знаю
                </div>
                
                <div className="flex items-center">
                  <span className="hidden sm:inline">Да</span>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ml-2">
                    <span className="text-green-500 text-xl">→</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      portalRef.current
    )
  ) : null;
};
