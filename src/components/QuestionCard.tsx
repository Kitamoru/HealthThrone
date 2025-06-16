import React from 'react';

interface QuestionCardProps {
  question: {
    id: number;
    text: string;
    positive_answer: string;
    negative_answer: string;
  };
  onAnswer: (id: number, isPositive: boolean) => void;
  answered: boolean;
}

export const QuestionCard = React.memo(({ 
  question, 
  onAnswer,
  answered 
}: QuestionCardProps) => {
  return (
    <div className={`question-card ${answered ? 'answered' : ''}`}>
      <p className="question-text">{question.text}</p>
      <div className="answer-buttons">
        <button 
          className="answer-btn positive" 
          onClick={() => onAnswer(question.id, true)}
          disabled={answered}
        >
          {question.positive_answer}
        </button>
        <button 
          className="answer-btn negative" 
          onClick={() => onAnswer(question.id, false)}
          disabled={answered}
        >
          {question.negative_answer}
        </button>
      </div>
    </div>
  );
});

QuestionCard.displayName = 'QuestionCard';
