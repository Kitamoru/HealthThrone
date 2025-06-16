import React from 'react';

export const Loader = React.memo(() => {
  return (
    <div className="loader-container">
      <div className="loader-spinner">
        <div className="pulse-circle"></div>
        <span className="loader-emoji">🚀</span>
      </div>
      <p className="loader-text">Загружаем данные...</p>
    </div>
  );
});
