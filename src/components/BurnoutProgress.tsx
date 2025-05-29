
import React from 'react';

interface BurnoutProgressProps {
  level: number;
  sprite?: string;
}

export const BurnoutProgress: React.FC<BurnoutProgressProps> = ({ level, sprite }) => {
  const progressWidth = (level / 10) * 100;
  
  return (
    <div className="header">
      <div className="sprite-container">
        {sprite ? (
          <img src={sprite} alt="Avatar" className="sprite" />
        ) : (
          <div className="sprite">😊</div>
        )}
      </div>
      
      <div className="pentagon">
        🔥
      </div>
      
      <div className="progress-wrapper">
        <div className="burnout-bar">
          <div
            className="burnout-progress"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};
