import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';

interface CharacterSpriteProps {
  spriteUrl?: string;
}

// Обновленная анимация тумана
const fogVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: [0.2, 0.6, 0.2], // Плавный переход между состояниями
    scale: [1, 1.1, 1],
    transition: {
      duration: 4 + i, // Увеличим длительность для плавности
      repeat: Infinity,
      delay: i * 0.8,
      ease: "easeInOut"
    }
  })
};

const CharacterSprite = React.memo(({ 
  spriteUrl = '/IMG_0476.png'
}: CharacterSpriteProps) => {
  const [displaySprite, setDisplaySprite] = useState(spriteUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const firstRender = useRef(true);
  const prevSpriteRef = useRef(spriteUrl);
  
  // Обновленные параметры тумана с более плавными цветами
  const fogLayers = [
    { size: 1.0, color: "rgba(15, 238, 158, 0.2)", delay: 0 },
    { size: 1.2, color: "rgba(15, 238, 158, 0.15)", delay: 1 },
    { size: 0.8, color: "rgba(15, 238, 158, 0.25)", delay: 2 }
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
        style={{
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Темный фон круга */}
        <div 
          className="circle-background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '999px',
            background: '#161616',
            zIndex: 1
          }}
        />
        
        {/* Слои тумана */}
        {fogLayers.map((layer, i) => (
          <motion.div
            key={`fog-${i}`}
            className="fog-layer"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fogVariants}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '999px',
              background: `radial-gradient(circle at center, ${layer.color} 0%, transparent 70%)`,
              zIndex: 2,
            }}
          />
        ))}

        {/* Спрайт персонажа */}
        <img 
          src={displaySprite} 
          alt="Character" 
          className={`sprite ${isAnimating ? 'sprite-fade-in' : ''}`}
          style={{ 
            position: 'relative', 
            zIndex: 3,
            maxWidth: '90%',
            maxHeight: '90%'
          }}
          onError={(e) => {
            e.currentTarget.src = '/sprite.gif';
          }}
        />
      </motion.div>
    </div>
  );
});

export default CharacterSprite;
