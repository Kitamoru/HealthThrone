import React, { useState, useEffect, useRef } from 'react';
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

export const SurveyModal: React.FC<SurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  questions 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no' | 'skip'>>({});
  const tinderCardRef = useRef<any>(null);
  const [lastDirection, setLastDirection] = useState<Direction | null>(null);

  // Используем ref для синхронизации значений в асинхронных операциях
  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    answersRef.current = answers;
    currentIndexRef.current = currentIndex;
  }, [answers, currentIndex]);

  // Блокировка прокрутки фона при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setLastDirection(null);
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
    setLastDirection(dir);
    const thisIndex = currentIndexRef.current;
    
    // Обработка свайпа вверх (пропуск)
    if (dir === 'up') {
      setAnswers(prev => ({ ...prev, [questions[thisIndex].id]: 'skip' }));
    } 
    // Обработка свайпов влево/вправо
    else if (dir === 'left' || dir === 'right') {
      const answer = dir === 'right' ? 'yes' : 'no';
      setAnswers(prev => ({ ...prev, [questions[thisIndex].id]: answer }));
    }

    // Переход к следующему вопросу или завершение
    setTimeout(() => {
      if (thisIndex >= questions.length - 1) {
        onComplete(answersRef.current);
        onClose();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleSkip = () => {
    // Вызываем программный свайп вверх для анимации
    if (tinderCardRef.current?.swipe) {
      tinderCardRef.current.swipe('up')
        .catch(() => {
          // Ручной вызов если свайп не сработал
          handleSwipe('up');
        });
    } else {
      handleSwipe('up');
    }
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    const direction = answer === 'yes' ? 'right' : 'left';
    
    // Вызываем свайп через ref
    if (tinderCardRef.current && tinderCardRef.current.swipe) {
      tinderCardRef.current.swipe(direction)
        .catch((err: any) => {
          console.error('Swipe error:', err);
          // Ручная обработка, если свайп не сработал
          handleSwipe(direction);
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="survey-modal-overlay">
      <motion.div 
        className="survey-modal-container"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Прогресс-бар */}
        <div className="survey-modal-header">
          <p className="survey-progress-text">
            Вопрос {currentIndex + 1} из {questions.length}
          </p>
          <div className="survey-progress-track">
            <div 
              className="survey-progress-bar"
              style={{ 
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
        
        {/* Область вопроса */}
        <div className="survey-question-container">
          {questions.length > 0 && (
            <div className="swipe-card-wrapper">
              <TinderCard
                key={currentIndex}
                ref={tinderCardRef}
                onSwipe={handleSwipe}
                onCardLeftScreen={(dir) => console.log('Card left screen', dir)}
                preventSwipe={['down']} // Разрешаем свайп вверх
                swipeRequirementType="position"
                swipeThreshold={150}
                className="swipe-card"
              >
                <div className="survey-card">
                  <p className="survey-card-text">
                    {questions[currentIndex]?.text}
                  </p>
                </div>
              </TinderCard>
            </div>
          )}
        </div>
        
        {/* Кнопки ответов */}
        <div className="survey-buttons-container">
          <button
            onClick={() => handleAnswer('no')}
            className="survey-button survey-button-no"
          >
            <span className="button-icon">←</span>
          </button>
          
          <button
            onClick={handleSkip}
            className="survey-button survey-button-skip"
          >
            <span className="button-icon">↻</span>
          </button>
          
          <button
            onClick={() => handleAnswer('yes')}
            className="survey-button survey-button-yes"
          >
            <span className="button-icon">→</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
