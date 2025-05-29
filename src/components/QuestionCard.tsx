import React from 'react';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  index: number;
  isAnswered: boolean;
  onAnswer: (isPositive: boolean) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isAnswered,
  onAnswer
}) => {
  return (
    <div className={`question-card ${isAnswered ? 'answered' : ''}`}>
      <h3 className="question-text">{question.text}</h3>

      <div className="answer-buttons">
        <button
          className="answer-btn negative"
          onClick={() => onAnswer(false)}
          disabled={isAnswered}
        >
          {question.negative_answer} {isAnswered ? '✓' : ''}
        </button>

        <button
          className="answer-btn positive"
          onClick={() => onAnswer(true)}
          disabled={isAnswered}
        >
          {question.positive_answer} {isAnswered ? '✓' : ''}
        </button>
      </div>
    </div>
  );
};