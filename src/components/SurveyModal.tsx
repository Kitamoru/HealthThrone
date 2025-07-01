import React, { useState, useEffect } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

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

const SWIPE_THRESHOLD = 100;
const VERTICAL_SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 1;

export const SurveyModal: React.FC<SurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  questions 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no' | 'skip'>>({});
  const [isSwiping, setIsSwiping] = useState(false);
  const controls = useAnimation();

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

  const handleDragStart = () => {
    setIsSwiping(true);
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwiping(false);
    
    // Проверяем горизонтальный свайп
    const horizontalSwipe = 
      Math.abs(info.offset.x) > SWIPE_THRESHOLD || 
      Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    
    // Проверяем вертикальный свайп вниз
    const verticalSwipeDown = 
      info.offset.y > VERTICAL_SWIPE_THRESHOLD || 
      info.velocity.y > SWIPE_VELOCITY;
    
    if (horizontalSwipe) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const answer = direction === 'right' ? 'yes' : 'no';
      
      // Анимация свайпа
      await controls.start({
        x: direction === 'right' ? '100vw' : '-100vw',
        opacity: 0,
        rotate: direction === 'right' ? 30 : -30,
        transition: { duration: 0.3 }
      });
      
      handleAnswer(answer);
    } 
    // Обработка вертикального свайпа вниз
    else if (verticalSwipeDown) {
      // Анимация свайпа вниз
      await controls.start({
        y: '100vh',
        opacity: 0,
        transition: { duration: 0.3 }
      });
      
      handleSkip();
    }
    else {
      // Возврат в исходное положение
      controls.start({ 
        x: 0, 
        y: 0, 
        opacity: 1, 
        rotate: 0,
        transition: { duration: 0.3 }
      });
    }
  };

  const handleSkip = () => {
    if (isSwiping) return;
    
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: 'skip' }));
    goToNextQuestion();
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (isSwiping) return;
    
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: answer }));
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Сброс анимации для следующего вопроса
      controls.start({ 
        x: 0, 
        y: 0, 
        opacity: 1, 
        rotate: 0 
      });
    } else {
      onComplete(answers);
      onClose();
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
        
        {/* Область вопроса с жестами */}
        <div className="survey-question-container">
          {questions.length > 0 && (
            <motion.div
              className="survey-card"
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              animate={controls}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: isSwiping ? 'grabbing' : 'grab' }}
            >
              <p className="survey-card-text">
                {questions[currentIndex]?.text}
              </p>
            </motion.div>
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
