import React, { useState, useEffect, useRef } from 'react';

interface BurnoutProgressProps {
  level: number;
  spriteUrl?: string;
}

export const BurnoutProgress = React.memo(({ 
  level, 
  spriteUrl = '/sprite.gif'
}: BurnoutProgressProps) => {
  const [currentSprite, setCurrentSprite] = useState(spriteUrl);
  const [previousSprite, setPreviousSprite] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const prevSpriteRef = useRef(spriteUrl);

  useEffect(() => {
    if (spriteUrl !== prevSpriteRef.current) {
      setPreviousSprite(prevSpriteRef.current);
      setCurrentSprite(spriteUrl);
      setIsChanging(true);
      prevSpriteRef.current = spriteUrl;
      
      const timer = setTimeout(() => {
        setPreviousSprite(null);
        setIsChanging(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [spriteUrl]);

  return (
    <div className="header">
      <div className="sprite-container">
        {previousSprite && (
          <img 
            src={previousSprite} 
            alt="Previous Character" 
            className={`sprite ${isChanging ? 'fade-out' : ''}`}
            onError={(e) => {
              e.currentTarget.src = '/sprite.gif';
            }}
          />
        )}
        <img 
          src={currentSprite} 
          alt="Character" 
          className={`sprite ${isChanging ? 'fade-in' : ''}`}
          onError={(e) => {
            e.currentTarget.src = '/sprite.gif';
          }}
        />
        
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
    </div>
  );
});
