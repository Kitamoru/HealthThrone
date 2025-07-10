import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface CharacterSpriteProps {
  spriteUrl?: string;
}

const CharacterSprite = React.memo(({ 
  spriteUrl = '/sprite.gif'
}: CharacterSpriteProps) => {
  const [displaySprite, setDisplaySprite] = useState(spriteUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const firstRender = useRef(true);
  const prevSpriteRef = useRef(spriteUrl);
  const glowControls = useAnimation();

  useEffect(() => {
    // Запускаем анимацию свечения при монтировании
    const animateGlow = async () => {
      while (true) {
        await glowControls.start({
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.05, 1],
          transition: {
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.5, 1]
          }
        });
      }
    };
    animateGlow();
    
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
  }, [spriteUrl, isAnimating, glowControls]);

  return (
    <div className="sprite-container">
      <div className="sprite-background">
        {/* Анимированное свечение */}
        <motion.div
          className="sprite-glow"
          animate={glowControls}
          initial={{ opacity: 0.4, scale: 1 }}
        />
        
        <img 
          src={displaySprite} 
          alt="Character" 
          className={`sprite ${isAnimating ? 'sprite-fade-in' : ''}`}
          onError={(e) => {
            e.currentTarget.src = '/sprite.gif';
          }}
        />
      </div>
    </div>
  );
});

export default CharacterSprite;
