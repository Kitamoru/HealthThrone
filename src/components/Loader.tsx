import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="loader-spinner">
          <div className="pulse-circle"></div>
          <span className="loader-emoji">🚀</span>
        </div>
        <p className="loader-text">Загружаем данные...</p>
      </div>
    </div>
  );
};
