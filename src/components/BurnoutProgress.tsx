import React from 'react';

interface BurnoutProgressProps {
  level: number;
}

export const BurnoutProgress: React.FC<BurnoutProgressProps> = ({ level }) => {
  return (
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
        {level}
      </div>
    </div>
  );
};