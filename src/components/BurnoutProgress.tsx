import React, { useState, useEffect, useRef } from 'react';

interface BurnoutProgressProps {
  level: number;
  spriteUrl?: string;
}

export const BurnoutProgress = React.memo(({ 
  level, 
  spriteUrl = '/sprite.gif'
}: BurnoutProgressProps) => {
  const [displaySprite, setDisplaySprite] = useState(spriteUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const firstRender = useRef(true);
  const prevSpriteRef = useRef(spriteUrl);

  useEffect(() => {
    // Пропускаем анимацию при первом рендере
    if (firstRender.current) {
      firstRender.current = false;
      prevSpriteRef.current = spriteUrl;
      return;
    }

    // Если спрайт изменился
    if (spriteUrl !== prevSpriteRef.current) {
      // Если нет активной анимации - сразу обновляем
      if (!isAnimating) {
        prevSpriteRef.current = spriteUrl;
        setDisplaySprite(spriteUrl);
        setIsAnimating(true);
        
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } 
      // Если анимация активна - ставим в очередь обновление
      else {
        const timer = setTimeout(() => {
          prevSpriteRef.current = spriteUrl;
          setDisplaySprite(spriteUrl);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [spriteUrl, isAnimating]);

  return (
    <>
      <div className="header">
        <div className="sprite-container">
          <img 
            src={displaySprite} 
            alt="Character" 
            className={`sprite ${isAnimating ? 'sprite-fade-in' : ''}`}
            onError={(e) => {
              e.currentTarget.src = '/sprite.gif';
            }}
          />
        </div>

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
    </>
  );
});
