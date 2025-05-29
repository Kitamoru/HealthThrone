import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader" />
      <p>Загружаем данные...</p>
    </div>
  );
};