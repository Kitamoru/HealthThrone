import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader-overlay">
        <div className="loader">
          <div className="loader-spinner">
            <div className="pulse-circle"></div>
            <span className="loader-emoji">🚀</span>
          </div>
          <p className="loader-text">Загружаем данные...</p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
