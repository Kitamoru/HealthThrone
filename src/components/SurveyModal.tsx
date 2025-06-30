import React, { useState, useCallback, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { Question } from '../lib/types';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSubmit: (answers: Record<number, boolean | null>) => void;
  isLoading: boolean;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  questions,
  onSubmit,
  isLoading
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  
  // Сброс состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setAnswers({});
    }
  }, [isOpen]);

  const handleAnswer = useCallback((answer: boolean | null) => {
    const questionId = questions[currentIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Переход к следующему вопросу
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Если это последний вопрос, сразу отправляем результаты
      onSubmit({ ...answers, [questionId]: answer });
    }
  }, [currentIndex, questions, onSubmit, answers]);

  // При завершении опроса
  useEffect(() => {
    if (currentIndex === questions.length) {
      onSubmit(answers);
    }
  }, [currentIndex, questions.length, answers, onSubmit]);

  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Бэкдроп */}
      <div className="fixed inset-0 bg-black opacity-30" />
      
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="test-step inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-tg-secondary shadow-xl rounded-2xl border border-tg-border">
          <div className="progress-container">
            <div className="progress-text text-tg-hint text-sm mb-2">
              Вопрос {currentIndex + 1} из {questions.length}
            </div>
            <div className="progress-bar w-full h-2 bg-tg-secondary rounded overflow-hidden">
              <div 
                className="progress-fill h-full bg-tg-accent rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-tg-text mt-4"
          >
            Тест на выгорание
          </Dialog.Title>

          <div className="test-container mt-8 flex justify-center items-center min-h-[200px] relative">
            {currentIndex < questions.length && (
              <TinderCard
                key={currentIndex}
                onSwipe={(dir) => handleAnswer(dir === 'right')}
                preventSwipe={['up', 'down']}
                className="absolute w-full"
              >
                <div
                  className="w-full p-6 bg-tg-secondary border border-tg-border rounded-xl shadow-md cursor-pointer"
                >
                  <p className="test-text text-tg-text text-xl font-medium text-center">
                    {questions[currentIndex].text}
                  </p>
                </div>
              </TinderCard>
            )}

            {currentIndex === questions.length && (
              <div className="result-step text-center w-full">
                <div className="result-header">
                  <h2 className="text-2xl font-bold text-tg-text">Опрос завершен!</h2>
                </div>
                <div className="result-card mt-4">
                  <p className="class-description text-tg-text">
                    Ваши ответы успешно сохранены. Результаты теста можно увидеть на главной странице.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="answers-container mt-8 grid grid-cols-3 gap-3">
            <button 
              className="answer-button bg-tg-secondary border border-tg-border rounded-xl py-3 px-4 text-tg-text transition-all hover:bg-tg-accent hover:bg-opacity-10"
              onClick={() => handleAnswer(false)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Нет
            </button>
            <button 
              className="answer-button bg-tg-secondary border border-tg-border rounded-xl py-3 px-4 text-tg-text transition-all hover:bg-tg-accent hover:bg-opacity-10"
              onClick={() => handleAnswer(null)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Не знаю
            </button>
            <button 
              className="answer-button bg-tg-secondary border border-tg-border rounded-xl py-3 px-4 text-tg-text transition-all hover:bg-tg-accent hover:bg-opacity-10"
              onClick={() => handleAnswer(true)}
              disabled={currentIndex >= questions.length || isLoading}
            >
              Да
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 text-center">
              <p className="text-tg-hint">Сохранение результатов...</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
