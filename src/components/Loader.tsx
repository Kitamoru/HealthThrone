import React from 'react';
import '.src/styles/loader.css'; // Подключаем стили

export const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader-spinner">
        <div className="pulse-circle"></div>
        <span className="loader-emoji">🚀</span>
      </div>
      <p className="loader-text">Загружаем данные...</p>
    </div>
  );
};
