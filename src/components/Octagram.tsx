import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface OctagramProps {
  values: number[]; // Массив чисел от 0 до 1, длиной ровно 8 элементов
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  const [isRaysAnimationComplete, setIsRaysAnimationComplete] = useState(false);
  const controls = useAnimation();

  const center = size / 2;
  const outerRadius = size * 0.4;
  const innerRadius = outerRadius * 0.4;

  const getPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad)
    };
  };

  const createOctagramPath = () => {
    const points = [
      getPoint(-90, outerRadius),
      getPoint(-45, innerRadius),
      getPoint(0, outerRadius),
      getPoint(45, innerRadius),
      getPoint(90, outerRadius),
      getPoint(135, innerRadius),
      getPoint(180, outerRadius),
      getPoint(225, innerRadius)
    ];

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < 8; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    return path + ' Z';
  };

  // Обработчик завершения всех лучей
  const handleRaysComplete = () => {
    setTimeout(() => setIsRaysAnimationComplete(true), 300);
  };

  // Запуск финальной анимации
  useEffect(() => {
    if (isRaysAnimationComplete) {
      controls.start({
        pathLength: 1,
        opacity: 1
      });
    }
  }, [isRaysAnimationComplete, controls]);

  const createValueRays = () => {
    return values.map((value, index) => {
      const angle = index * 45 - 90;
      const outerPoint = getPoint(angle, outerRadius);

      return (
        <motion.line
          key={`ray-${index}`}
          x1={center}
          y1={center}
          x2={center}
          y2={center}
          stroke="#00D4FF"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            x2: outerPoint.x,
            y2: outerPoint.y
          }}
          transition={{
            delay: index * 0.1,
            duration: 1.5,
            type: "spring",
            damping: 10
          }}
          onAnimationComplete={
            index === values.length - 1 ? handleRaysComplete : undefined
          }
          filter="url(#glow)"
        />
      );
    });
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#0077FF" stopOpacity="0.2"/>
          </linearGradient>
        </defs>

        {/* Анимированные лучи */}
        {createValueRays()}

        {/* Оконтуривание октаграммы */}
        <motion.path
          d={createOctagramPath()}
          fill="none"
          stroke="#8A2BE2"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={controls}
          transition={{
            duration: 2,
            ease: "easeInOut"
          }}
          filter="url(#glow)"
        />

        {/* Вершины (появляются после контура) */}
        {Array.from({ length: 8 }).map((_, index) => {
          const angle = index * 45 - 90;
          const point = getPoint(angle, outerRadius);

          return (
            <motion.circle
              key={`vertex-${index}`}
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#00D4FF"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={isRaysAnimationComplete ? {
                scale: [0, 1.3, 1],
                opacity: 1,
                y: 0
              } : {}}
              transition={{
                delay: 0.5 + index * 0.1,
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 1
              }}
              filter="url(#glow)"
            />
          );
        })}

        {/* Центральная фигура ("Кристалл") */}
        <motion.polygon
          points={`
            ${center - 15},${center} 
            ${center},${center - 15} 
            ${center + 15},${center} 
            ${center},${center + 15}
          `}
          fill="url(#crystalGradient)"
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: 1,
            rotate: 360,
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            delay: 1,
            duration: 8,
            rotate: {
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

export default Octagram;
