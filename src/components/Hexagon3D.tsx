import React from 'react';
import { useSpring, animated } from 'react-spring';
import { motion } from 'framer-motion';

interface Hexagon3DProps {
  index: number;
  value: number;
  color: string;
}

const calc = (value: number) => {
  return `hsl(${value * 0.7}, 80%, 60%)`;
};

export const Hexagon3D: React.FC<Hexagon3DProps> = ({ index, value, color }) => {
  const rotation = 45 * index;
  const depth = value / 20;

  const styles = useSpring({
    transform: `rotateY(${rotation}deg) translateZ(${depth}px)`,
    background: `linear-gradient(135deg, ${color}, ${shadeColor(color, -20)})`,
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.div 
      className="hexagon-3d"
      style={styles}
    >
      <motion.div 
        className="hexagon-value"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {value}%
      </motion.div>
    </animated.div>
  );
};

// Вспомогательная функция для изменения цвета
function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.min(255, Math.max(0, R + R * percent / 100));
  G = Math.min(255, Math.max(0, G + G * percent / 100));
  B = Math.min(255, Math.max(0, B + B * percent / 100));

  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}
