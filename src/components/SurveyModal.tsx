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

  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    answersRef.current = answers;
    currentIndexRef.current = currentIndex;
  }, [answers, currentIndex]);

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
    
    if (dir === 'up') {
      setAnswers(prev => ({ ...prev, [questions[thisIndex].id]: 'skip' }));
    } 
    else if (dir === 'left' || dir === 'right') {
      const answer = dir === 'right' ? 'yes' : 'no';
      setAnswers(prev => ({ ...prev, [questions[thisIndex].id]: answer }));
    }

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
    if (tinderCardRef.current?.swipe) {
      tinderCardRef.current.swipe('up')
        .catch(() => handleSwipe('up'));
    } else {
      handleSwipe('up');
    }
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    const direction = answer === 'yes' ? 'right' : 'left';
    
    if (tinderCardRef.current && tinderCardRef.current.swipe) {
      tinderCardRef.current.swipe(direction)
        .catch(() => handleSwipe(direction));
    }
  };

  if (!isOpen) return null;

  // Общие стили для кнопок
  const buttonCommonStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    backgroundColor: 'black',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
  };

  return (
    <div className="survey-modal-overlay">
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
        {questions.length > 0 && (
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
            className="survey-button"
            aria-label="Нет"
            style={{ ...buttonCommonStyle, width: 72, height: 72 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: '100%', height: '100%' }}>
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 9.86a4.5 4.5 0 0 0 -3.214 1.35a1 1 0 1 0 1.428 1.4a2.5 2.5 0 0 1 3.572 0a1 1 0 0 0 1.428 -1.4a4.5 4.5 0 0 0 -3.214 -1.35zm-2.99 -4.2l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm6 0l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z" />
            </svg>
          </button>
          
          <button
            onClick={handleSkip}
            className="survey-button"
            aria-label="Пропустить"
            style={{ ...buttonCommonStyle, width: 36, height: 36 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: '100%', height: '100%' }}>
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-2 10.66h-6l-.117 .007a1 1 0 0 0 0 1.986l.117 .007h6l.117 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-5.99 -5l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm6 0l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z" />
            </svg>
          </button>
          
          <button
            onClick={() => handleAnswer('yes')}
            className="survey-button"
            aria-label="Да"
            style={{ ...buttonCommonStyle, width: 72, height: 72 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: '100%', height: '100%' }}>
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-2 9.66h-6a1 1 0 0 0 -1 1v.05a3.975 3.975 0 0 0 3.777 3.97l.227 .005a4.026 4.026 0 0 0 3.99 -3.79l.006 -.206a1 1 0 0 0 -1 -1.029zm-5.99 -5l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993zm6 0l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993z" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
