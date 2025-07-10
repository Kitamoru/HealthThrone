import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      prevSpriteRef.current = spriteUrl;
      return;
    }

    if (spriteUrl !== prevSpriteRef.current) {
      if (!isAnimating) {
        prevSpriteRef.current = spriteUrl;
        setDisplaySprite(spriteUrl);
        setIsAnimating(true);
        
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          prevSpriteRef.current = spriteUrl;
          setDisplaySprite(spriteUrl);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [spriteUrl, isAnimating]);

  return (
    <div className="sprite-container">
      <div className="sprite-background">
        <img 
          src={displaySprite} 
          alt="Character" 
          className={`sprite ${isAnimating ? 'sprite-fade-in' : ''}`}
          onError={(e) => {
            e.currentTarget.src = '/sprite.gif';
          }}
        />
      </div>
      
      {/* Внешнее свечение вокруг контейнера */}
      <motion.div
        className="outer-glow"
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.08, 1]
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
    </div>
  );
});

export default CharacterSprite;
