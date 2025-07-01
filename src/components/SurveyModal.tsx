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

const swipeThreshold = 50;

export const SurveyModal: React.FC<SurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  questions 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no' | 'skip'>>({});
  const tinderCardRef = useRef<any>(null);

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
    const answer = dir === 'right' ? 'yes' : 'no';
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: answer }));
    
    // Переход к следующему вопросу
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete(answers);
        onClose();
      }
    }, 300);
  };

  const handleSkip = () => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: 'skip' }));
    
    // Переход к следующему вопросу
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(answers);
      onClose();
    }
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    const direction = answer === 'yes' ? 'right' : 'left';
    
    // Вызываем свайп через ref
    if (tinderCardRef.current && tinderCardRef.current.swipe) {
      tinderCardRef.current.swipe(direction)
        .then(() => {
          // Ответ обрабатывается в handleSwipe
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
            <motion.div 
              className="survey-progress-bar"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${((currentIndex + 1) / questions.length) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Область вопроса */}
        <div className="survey-question-container">
          {questions.length > 0 && (
            <TinderCard
              key={currentIndex}
              ref={tinderCardRef}
              onSwipe={handleSwipe}
              onCardLeftScreen={() => {}} // Обязательный пропс
              preventSwipe={['up', 'down']}
              swipeThreshold={swipeThreshold}
              className="swipe-card-container"
            >
              <div className="survey-card">
                <p className="survey-card-text">
                  {questions[currentIndex]?.text}
                </p>
              </div>
            </TinderCard>
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
