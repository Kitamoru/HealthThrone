import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';

interface CharacterSpriteProps {
  spriteUrl?: string;
}

// Варианты анимации для тумана
const fogVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: [0.2, 0.4, 0.2],
    scale: [1, 1.1, 1],
    transition: {
      duration: 3 + i,
      repeat: Infinity,
      delay: i * 0.8,
      ease: "easeInOut"
    }
  }),
  tap: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1.05, 1.15, 1.05],
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const CharacterSprite = React.memo(({ 
  spriteUrl = '/sprite.gif'
}: CharacterSpriteProps) => {
  const [displaySprite, setDisplaySprite] = useState(spriteUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const firstRender = useRef(true);
  const prevSpriteRef = useRef(spriteUrl);
  
  // Создаем несколько слоев тумана с разными характеристиками
  const fogLayers = [
    { size: 1.0, color: "rgba(15, 238, 158, 0.15)", delay: 0 },
    { size: 1.2, color: "rgba(15, 238, 158, 0.1)", delay: 1 },
    { size: 0.8, color: "rgba(15, 238, 158, 0.2)", delay: 2 }
  ];

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
      <motion.div 
        className="sprite-background"
        whileTap={{ scale: 0.98 }}
      >
        {/* Слои тумана с разными анимациями */}
        {fogLayers.map((layer, i) => (
          <motion.div
            key={i}
            className="fog-layer"
            custom={i}
            initial="hidden"
            animate="visible"
            whileTap="tap"
            variants={fogVariants}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '999px',
              background: `radial-gradient(circle at center, ${layer.color} 0%, transparent 70%)`,
              zIndex: 1,
            }}
          />
        ))}

        <img 
          src={displaySprite} 
          alt="Character" 
          className={`sprite ${isAnimating ? 'sprite-fade-in' : ''}`}
          style={{ position: 'relative', zIndex: 2 }}
          onError={(e) => {
            e.currentTarget.src = '/sprite.gif';
          }}
        />
      </motion.div>
    </div>
  );
});

export default CharacterSprite;
