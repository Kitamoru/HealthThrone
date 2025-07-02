import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

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
    if (!values || values.length !== 8) {
      console.error('Invalid values for Octagram:', values);
      return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    }
    
    return values.map(v => {
      const clamped = Math.max(0, Math.min(1, v));
      console.log(`Normalized value: ${v} -> ${clamped}`);
      return clamped;
    });
  }, [values]);

  const getPoint = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const getOctagonPointsByRadius = (r: number) =>
    Array.from({ length: 8 }, (_, i) => getPoint(i * 45 - 90, r));

  const getMidPoints = (vertices: { x: number; y: number }[]) =>
    vertices.map((p, i) => {
      const next = vertices[(i + 1) % vertices.length];
      return {
        x: (p.x + next.x) / 2,
        y: (p.y + next.y) / 2,
      };
    });

  const createOctagonPath = (vertices: { x: number; y: number }[]) =>
    `M ${vertices.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  const octagonPoints = getOctagonPointsByRadius(radius);
  const midPoints = getMidPoints(octagonPoints);
  const octagonPath = createOctagonPath(octagonPoints);

  // Анимация - упрощённая версия
  useEffect(() => {
    if (isLoading) return;
    
    const runAnimation = async () => {
      // Сброс анимации
      await octagonControls.start({
        pathLength: 0,
        opacity: 0
      });
      
      // Показываем вершины
      setPhase('vertices');
      
      // Показываем восьмиугольник
      setTimeout(() => {
        setPhase('octagon');
        octagonControls.start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 0.8 }
        });
      }, 300);
      
      // Показываем лучи и сектора
      setTimeout(() => {
        setPhase('rays');
      }, 1000);
      
      // Финальная пульсация
      setTimeout(() => {
        setPhase('pulse');
        pulseControls.start({
          scale: [1, 1.02, 1],
          transition: { duration: 2, repeat: Infinity }
        });
        crystalControls.start({
          scale: [1, 1.05, 1],
          transition: { duration: 1.5, repeat: Infinity }
        });
      }, 1500);
    };

    runAnimation();
  }, [values, isLoading]);

  const renderRadialLevels = () => {
    return Array.from({ length: 5 }).map((_, i) => {
      const r = radius * ((i + 1) / 6);
      const path = createOctagonPath(getOctagonPointsByRadius(r));
      return (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="#1E90FF"
          strokeWidth={0.5}
          strokeOpacity={0.1}
        />
      );
    });
  };

  const renderSectors = () => {
    console.log('Rendering sectors with values:', normalizedValues);
    
    return normalizedValues.map((value, i) => {
      if (value < 0.01) {
        console.log(`Skipping sector ${i} with value ${value}`);
        return null;
      }
      
      const angleStart = i * 45 - 90;
      const angleEnd = (i + 1) * 45 - 90;
      const rInner = radius * 0.1;
      const rOuter = rInner + radius * 0.8 * value;
      
      const p1 = getPoint(angleStart, rInner);
      const p2 = getPoint(angleStart, rOuter);
      const p3 = getPoint(angleEnd, rOuter);
      const p4 = getPoint(angleEnd, rInner);
      
      // Упрощённый путь без дуг
      const d = `M ${p1.x},${p1.y}
                L ${p2.x},${p2.y}
                L ${p3.x},${p3.y}
                L ${p4.x},${p4.y}
                Z`;
      
      console.log(`Sector ${i} path:`, d);
      
      return (
        <motion.path
          key={i}
          d={d}
          fill="#1E90FF" // Упрощённая заливка
          fillOpacity={0.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
        />
      );
    });
  };

  console.log('Rendering Octagram. Phase:', phase);
  
  return (
    <div style={{ 
      width: size, 
      height: size,
      backgroundColor: 'rgba(0,0,0,0.02)', // Для визуализации области
      borderRadius: 8,
      border: '1px dashed rgba(0,0,0,0.1)'
    }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="sector-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <motion.g animate={pulseControls}>
          {/* Концентрические круги */}
          {renderRadialLevels()}

          {/* Вершины восьмиугольника */}
          {octagonPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#1E90FF"
              opacity={phase !== 'vertices' ? 1 : 0}
            />
          ))}

          {/* Основной восьмиугольник */}
          <motion.path
            d={octagonPath}
            fill="none"
            stroke="#1E90FF"
            strokeWidth={1.5}
            strokeOpacity={0.8}
            animate={octagonControls}
          />

          {/* Сектора - всегда видимые */}
          {renderSectors()}

          {/* Лучи */}
          {phase !== 'vertices' && midPoints.map((p, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#1E90FF"
              strokeWidth={0.7}
              strokeOpacity={0.15}
              strokeLinecap="round"
            />
          ))}

          {/* Центральный кристалл */}
          <motion.circle
            cx={center}
            cy={center}
            r="8"
            fill="url(#sector-gradient)"
            animate={crystalControls}
          />
        </motion.g>
        
        {/* Вспомогательные элементы для отладки */}
        <circle cx={center} cy={center} r="2" fill="red" />
        <text x="10" y="20" fill="black" fontSize="12">
          Phase: {phase} | Values: {normalizedValues.map(v => v.toFixed(1)).join(',')}
        </text>
      </svg>
    </div>
  );
};

export default Octagram;
