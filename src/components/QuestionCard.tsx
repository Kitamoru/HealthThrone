import { motion } from 'framer-motion';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (isPositive: boolean) => void;
  disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAnswer, 
  disabled = false 
}) => {
  return (
    <motion.div
      className="question-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="question-text">{question.text}</h3>
      <div className="answer-buttons">
        <motion.button
          className="answer-btn negative"
          onClick={() => onAnswer(false)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
          {question.negative_answer}
        </motion.button>
        <motion.button
          className="answer-btn positive"
          onClick={() => onAnswer(true)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
          {question.positive_answer}
        </motion.button>
      </div>
    </motion.div>
  );
};