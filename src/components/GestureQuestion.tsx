import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';

interface GestureQuestionProps {
  question: string;
  onAnswer: (value: number) => void;
}

export const GestureQuestion: React.FC<GestureQuestionProps> = ({ question, onAnswer }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onAnswer(-1),
    onSwipedRight: () => onAnswer(1),
    trackMouse: true
  });

  return (
    <div {...handlers} className="gesture-question">
      <motion.div 
        className="question-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {question}
      </motion.div>
      
      <div className="gesture-hints">
        <motion.div 
          className="hint left"
          whileTap={{ scale: 0.9 }}
          onClick={() => onAnswer(-1)}
        >
          👎 Нет
        </motion.div>
        <motion.div 
          className="hint center"
          whileTap={{ scale: 0.9 }}
          onClick={() => onAnswer(0)}
        >
          🤔 Иногда
        </motion.div>
        <motion.div 
          className="hint right"
          whileTap={{ scale: 0.9 }}
          onClick={() => onAnswer(1)}
        >
          👍 Да
        </motion.div>
      </div>
    </div>
  );
};
