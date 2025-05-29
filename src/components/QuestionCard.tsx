
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';

interface QuestionCardProps {
  question: string;
  positiveAnswer: string;
  negativeAnswer: string;
  onAnswer: (isPositive: boolean) => void;
  disabled?: boolean;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  positiveAnswer,
  negativeAnswer,
  onAnswer,
  disabled = false,
  index
}) => {
  const { webApp } = useTelegram();

  const handleAnswer = (isPositive: boolean) => {
    if (disabled) return;
    
    // Haptic feedback
    webApp?.HapticFeedback.impactOccurred('light');
    onAnswer(isPositive);
  };

  return (
    <motion.div
      className="question-card"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.h3 
        className="question-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        {question}
      </motion.h3>
      
      <div className="answer-buttons">
        <motion.button
          className="answer-btn negative"
          onClick={() => handleAnswer(false)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          {negativeAnswer}
        </motion.button>
        
        <motion.button
          className="answer-btn positive"
          onClick={() => handleAnswer(true)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          {positiveAnswer}
        </motion.button>
      </div>
    </motion.div>
  );
};
