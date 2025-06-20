import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
      setIsAnimating(true);
      prevSpriteRef.current = spriteUrl;
      setDisplaySprite(spriteUrl);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [spriteUrl]);

  return (
    <div className="character-section">
      <div className="sprite-container">
        <motion.img 
          src={displaySprite} 
          alt="Character"
          className="sprite"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: isAnimating ? 1.05 : 1,
            filter: `brightness(${100 - level/2}%) saturate(${100 + level/2}%)`
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="burnout-section">
        <div className="level-display">
          <span className="level-label">Уровень выгорания</span>
          <span className="level-value">{level}%</span>
        </div>
        <div className="progress-wrapper">
          <div className="burnout-bar">
            <motion.div 
              className="burnout-progress"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(level, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
