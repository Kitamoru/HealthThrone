import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';

interface CharacterSpriteProps {
  spriteUrl?: string;
}

const fogVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: [0.2, 0.6, 0.2],  // Плавная пульсация прозрачности
    scale: [1, 1.15, 1],       // Легкое увеличение/уменьшение
    transition: {
      duration: 3.5 + i * 0.5, // Разная длительность для слоев
      repeat: Infinity,         // Бесконечное повторение
      ease: "easeInOut"         // Плавное ускорение/замедление
    }
  })
};

const CharacterSprite = React.memo(({ 
  spriteUrl = '/sprite.gif'
}: CharacterSpriteProps) => {
  const [displaySprite, setDisplaySprite] = useState(spriteUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const firstRender = useRef(true);
  const prevSpriteRef = useRef(spriteUrl);
  
  const fogLayers = [
    { color: "rgba(15, 238, 158, 0.15)" },
    { color: "rgba(15, 238, 158, 0.1)" },
    { color: "rgba(15, 238, 158, 0.2)" }
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
      <div 
        className="sprite-background"
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%'
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
        
        {/* Слои тумана с плавной пульсацией */}
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
            maxHeight: '90%',
            pointerEvents: 'none'
          }}
          onError={(e) => {
            e.currentTarget.src = '/sprite.gif';
          }}
        />
      </div>
    </div>
  );
});

export default CharacterSprite;
