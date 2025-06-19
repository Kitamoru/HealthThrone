import React from 'react';

interface BurnoutProgressProps {
  level: number;
  spriteUrl?: string;
}

export const BurnoutProgress = React.memo(({ 
  level, 
  spriteUrl = '/sprite.gif' // Значение по умолчанию в деструктуризации
}: BurnoutProgressProps) => {
  return (
    <>
      <div className="header">
        <div className="sprite-container">
          <img 
            src={spriteUrl} 
            alt="Character" 
            className="sprite"
            onError={(e) => {
              e.currentTarget.src = '/sprite.gif';
            }}
          />
        </div>

        <div className="pentagon">
          🔥
        </div>
      </div>

      <div className="burnout-section">
        <div className="level-display">
          <span className="level-label">Уровень выгорания</span>
          <span className="level-value">{level}%</span>
        </div>
        <div className="progress-wrapper">
          <div className="burnout-bar">
            <div 
              className="burnout-progress"
              style={{ width: `${Math.min(level, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
});
