import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

interface OctagramProps {
  values: number[]; // 8 значений от 0 до 1
  size?: number;
  isLoading?: boolean;
}

const Octagram = ({ values, size = 300, isLoading = false }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays' | 'pulse'>('vertices');
  const octagonControls = useAnimation();
  const crystalControls = useAnimation();
  const pulseControls = useAnimation();

  const center = size / 2;
  const radius = size * 0.4;

  // Проверка и нормализация значений
  const normalizedValues = useMemo(() => {
    console.log('Original values:', values);
    // Защита от некорректных данных
    if (!Array.isArray(values) || values.length !== 8 || values.some(v => typeof v !== 'number' || isNaN(v))) {
      console.error('Invalid values for Octagram:', values);
      return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    }
    
    return values.map(v => {
      const clamped = Math.max(0, Math.min(1, v));
      console.log(`Normalized value: ${v} -> ${clamped}`);
      return clamped;
    });
  }, [values]);

  // ... остальной код без изменений
};
