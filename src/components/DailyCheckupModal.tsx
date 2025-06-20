import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GestureQuestion } from './GestureQuestion';

interface Question {
  id: number;
  text: string;
  weight: number;
  factor?: number;
}

interface DailyCheckupModalProps {
  burnoutQuestions: Question[];
  octalysisQuestions: Question[];
  onClose: () => void;
  onComplete: (burnoutDelta: number, factorsDelta: number[]) => void;
}

export const DailyCheckupModal: React.FC<DailyCheckupModalProps> = ({
  burnoutQuestions,
  octalysisQuestions,
  onClose,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(burnoutQuestions.length + octalysisQuestions.length).fill(null)
  );

  const questions = [...burnoutQuestions, ...octalysisQuestions];

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
    
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const handleSubmit = () => {
    // Рассчитываем дельту для выгорания
    const burnoutDelta = answers.slice(0, burnoutQuestions.length).reduce(
      (sum, answer, idx) => sum + (answer || 0) * burnoutQuestions[idx].weight, 0
    );
    
    // Для факторов Октализа
    const factorsDelta = Array(8).fill(0);
    
    answers.slice(burnoutQuestions.length).forEach((answer, idx) => {
      if (answer === null) return;
      const factorIndex = octalysisQuestions[idx].factor;
      if (factorIndex !== undefined) {
        factorsDelta[factorIndex] += (answer || 0) * octalysisQuestions[idx].weight;
      }
    });
    
    onComplete(burnoutDelta, factorsDelta);
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <motion.div 
      className="daily-checkup-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="modal-header">
        <h3>Ежедневный чекап</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>
      
      <div className="progress-bar">
        <motion.div 
          className="progress-fill"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <div className="questions-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="question-wrapper"
          >
            <GestureQuestion 
              question={questions[currentIndex].text}
              onAnswer={handleAnswer}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="progress-indicator">
        {currentIndex + 1} / {questions.length}
      </div>
      
      <div className="modal-footer">
        {answers.every(a => a !== null) ? (
          <motion.button 
            onClick={handleSubmit}
            className="submit-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Завершить
          </motion.button>
        ) : (
          <div className="hint">Свайпните влево/вправо или нажмите по центру</div>
        )}
      </div>
    </motion.div>
  );
};
