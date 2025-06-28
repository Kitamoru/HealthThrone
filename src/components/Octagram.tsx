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
   
