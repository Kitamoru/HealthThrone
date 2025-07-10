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
      
      {/* Асимметричное свечение */}
      <motion.div
        className="asymmetric-glow"
        initial={{ 
          opacity: 0.3,
          scale: 1,
          clipPath: "circle(50% at 50% 50%)"
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.15, 1],
          clipPath: [
            "circle(50% at 50% 50%)",
            "circle(60% at 60% 40%)",
            "circle(50% at 50% 50%)"
          ]
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
    </div>
  );
});

export default CharacterSprite;
