import React, { useState, useEffect } from 'react';

interface BurnoutProgressProps {
  level: number;
  spriteUrl?: string;
}

export const BurnoutProgress = React.memo(({ 
  level, 
  spriteUrl = '/sprite.gif'
}: BurnoutProgressProps) => {
  const [currentSprite, setCurrentSprite] = useState(spriteUrl);
  const [prevSprite, setPrevSprite] = useState(spriteUrl);
  const [isAnimating, setIsAnimating] = useState(false);

  // Эффект для обработки смены спрайта
  useEffect(() => {
    if (spriteUrl !== currentSprite) {
      setPrevSprite(currentSprite);
      setCurrentSprite(spriteUrl);
      setIsAnimating(true);
      
      // Таймер для завершения анимации
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500); // Длительность анимации (0.5s)
      
      return () => clearTimeout(timer);
    }
  }, [spriteUrl, currentSprite]);

  return (
    <>
      <div className="header">
        <div className="sprite-container">
          {/* Предыдущий спрайт (исчезающий) */}
          <img 
            src={prevSprite} 
            alt="Character" 
            className={`sprite ${isAnimating ? 'sprite-fade-out' : 'sprite-hidden'}`}
            onError={(e) => {
              e.currentTarget.src = '/sprite.gif';
            }}
          />
          
          {/* Новый спрайт (появляющийся) */}
          <img 
            src={currentSprite} 
            alt="Character" 
            className={`sprite ${isAnimating ? 'sprite-fade-in' : ''}`}
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
