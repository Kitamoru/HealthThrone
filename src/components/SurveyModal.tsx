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

  // Убраны useRef для answers и currentIndex - теперь работаем только с состоянием

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

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers({});
      setLastDirection(null);
    }
  }, [isOpen]);

  // Обработка Esc
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
    
    // Определяем ответ на основе направления
    const answer = 
      dir === 'right' ? 'yes' : 
      dir === 'left' ? 'no' : 
      'skip';
    
    // Обновляем ответы СИНХРОННО
    const newAnswers = {
      ...answers,
      [questions[currentIndex].id]: answer
    };
    
    setAnswers(newAnswers);
    
    // Переходим к следующему вопросу или завершаем
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Все вопросы пройдены - передаем ответы
      setTimeout(() => {
        onComplete(newAnswers);
        onClose();
      }, 300);
    }
  };

  const handleSkip = () => {
    if (tinderCardRef.current?.swipe) {
      tinderCardRef.current.swipe('up')
        .catch(() => {
          // Если не удалось программно свайпнуть, обрабатываем вручную
          handleSwipe('up');
        });
    } else {
      handleSwipe('up');
    }
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    const direction = answer === 'yes' ? 'right' : 'left';
    
    if (tinderCardRef.current?.swipe) {
      tinderCardRef.current.swipe(direction)
        .catch(() => {
          // Если не удалось программно свайпнуть, обрабатываем вручную
          handleSwipe(direction);
        });
    } else {
      handleSwipe(direction);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="survey-modal-overlay" onClick={onClose}>
      <motion.div 
        className="survey-modal-container"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
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
        
        <div className="survey-question-container">
          {questions.length > 0 && currentIndex < questions.length && (
            <div className="swipe-card-wrapper">
              <TinderCard
                key={currentIndex}
                ref={tinderCardRef}
                onSwipe={handleSwipe}
                preventSwipe={['down']}
                swipeRequirementType="position"
                swipeThreshold={50}
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
        
        <div className="survey-buttons-container">
          <button
            onClick={() => handleAnswer('no')}
            className="survey-button survey-button-no"
            aria-label="Нет"
          >
            <span className="button-icon">←</span>
          </button>
          
          <button
            onClick={handleSkip}
            className="survey-button survey-button-skip"
            aria-label="Пропустить"
          >
            <span className="button-icon">↑</span>
          </button>
          
          <button
            onClick={() => handleAnswer('yes')}
            className="survey-button survey-button-yes"
            aria-label="Да"
          >
            <span className="button-icon">→</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
