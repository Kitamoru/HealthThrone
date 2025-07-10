import React from 'react';

interface BurnoutBlockProps {
  level: number;
}

const BurnoutBlock = React.memo(({ 
  level
}: BurnoutBlockProps) => {
  return (
    <div className="burnout-section">
      <div className="level-display">
        <span className="level-label">Уровень здоровья</span>
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
  );
});

export default BurnoutBlock;
