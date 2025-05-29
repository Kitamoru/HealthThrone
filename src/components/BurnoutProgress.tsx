import React from 'react';

interface BurnoutProgressProps {
  level: number;
}

export const BurnoutProgress: React.FC<BurnoutProgressProps> = ({ level }) => {
  return (
    <>
      <div className="header">
        <div className="sprite-container">
          <img src="/sprite.gif" alt="Character" className="sprite" />
        </div>

        <div className="progress-wrapper">
          <div className="burnout-bar">
            <div 
              className="burnout-progress"
              style={{ width: `${Math.min(level, 100)}%` }}
            />
          </div>
        </div>

        <div className="pentagon">
          🔥
        </div>
      </div>
      
      <div className="burnout-level-display">
        <div className="level-text">Уровень выгорания</div>
        <div 
          className="level-value"
          style={{
            background: `linear-gradient(135deg, 
              ${level <= 30 ? '#2196F3' : level <= 60 ? '#FF9800' : '#F44336'}, 
              ${level <= 30 ? '#64B5F6' : level <= 60 ? '#FFB74D' : '#EF5350'})`
          }}
        >
          {level}%
        </div>
        <div className="level-description">
          {level < 30 && "💚 Отличное состояние"}
          {level >= 30 && level < 60 && "⚠️ Умеренное выгорание"}
          {level >= 60 && "🚨 Высокий уровень выгорания"}
        </div>
      </div>
    </>
  );
};