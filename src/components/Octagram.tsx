import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OctagramProps {
  values: number[]; // 8 values from 0 to 1
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays' | 'pulse'>('vertices');
  const octagonControls = useAnimation();
  const raysControls = useAnimation();
  const pulseControls = useAnimation();
  const levelsControls = useAnimation();

  const center = size / 2;
  const radius = size * 0.4;

  const getPoint = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  // Функция для получения точек октагона с любым радиусом
  const getOctagonPointsByRadius = (r: number) => {
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = i * 45 - 90;
      points.push(getPoint(angle, r));
    }
    return points;
  };

  // Основные точки октагона (внешний контур)
  const getOctagonPoints = () => getOctagonPointsByRadius(radius);

  const createOctagonPath = (vertices: { x: number; y: number }[]) => {
    let path = `M ${vertices[0].x},${vertices[0].y}`;
    for (let i = 1; i < vertices.length; i++) {
      path += ` L ${vertices[i].x},${vertices[i].y}`;
    }
    return path + ' Z';
  };

  // Calculate midpoints between vertices for rays
  const getMidPoints = (vertices: { x: number; y: number }[]) => {
    const midPoints = [];
    for (let i = 0; i < vertices.length; i++) {
      const nextIndex = (i + 1) % vertices.length;
      const midX = (vertices[i].x + vertices[nextIndex].x) / 2;
      const midY = (vertices[i].y + vertices[nextIndex].y) / 2;
      midPoints.push({ x: midX, y: midY });
    }
    return midPoints;
  };

  const octagonPoints = getOctagonPoints();
  const midPoints = getMidPoints(octagonPoints);
  const octagonPath = createOctagonPath(octagonPoints);

  // Vertex animation phase
  useEffect(() => {
    if (phase === 'vertices') {
      setTimeout(() => setPhase('octagon'), 600);
    }
  }, [phase]);

  // Octagon animation phase
  useEffect(() => {
    if (phase === 'octagon') {
      octagonControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeInOut' },
      }).then(() => {
        setPhase('rays');
      });
    }
  }, [phase, octagonControls]);

  // Rays and levels animation phase
  useEffect(() => {
    if (phase === 'rays') {
      // Animate radial levels
      levelsControls.start((i) => ({
        pathLength: 1,
        opacity: i === 9 ? 0.8 : 0.15,
        transition: { 
          delay: i * 0.05, 
          duration: 0.4,
          ease: 'easeOut'
        }
      }));

      // Start pulse after rays animation completes
      setTimeout(() => {
        setPhase('pulse');
        pulseControls.start({
          scale: [1, 1.03, 1],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        });
      }, 800);
    }
  }, [phase, pulseControls, levelsControls]);

  // Генерация радиальных линий (10 уровней)
  const renderRadialLevels = () => {
    const levels = 10;
    return Array.from({ length: levels }).map((_, index) => {
      // Для последнего уровня используем основной радиус
      const levelRadius = (radius * (index + 1)) / levels;
      
      const points = getOctagonPointsByRadius(levelRadius);
      const path = createOctagonPath(points);
      
      // Для внешнего контура делаем линию толще и ярче
      const isOuter = index === levels - 1;
      const strokeWidth = isOuter ? 1.5 : 0.5;
      const strokeColor = "#1E90FF";

      return (
        <motion.path
          key={`level-${index}`}
          custom={index}
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={levelsControls}
          strokeOpacity={isOuter ? 0.8 : 0.15}
        />
      );
    });
  };

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="ray-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Обертка для пульсации всей фигуры */}
        <motion.g animate={pulseControls}>
          {/* Радиальные уровни (отображаются всегда) */}
          {renderRadialLevels()}

          {/* Vertices */}
          {octagonPoints.map((point, index) => (
            <motion.circle
              key={`vertex-${index}`}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#1E90FF"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={
                phase !== 'vertices'
                  ? phase === 'pulse' 
                    ? { 
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }
                    : { scale: 1, opacity: 1, y: 0 }
                  : {
                      scale: [0, 1.3, 1],
                      opacity: 1,
                      y: 0,
                    }
              }
              transition={{
                delay: phase === 'vertices' ? index * 0.06 : 0,
                duration: 0.4,
              }}
              filter="url(#glow)"
            />
          ))}

          {/* Octagon */}
          {(phase === 'octagon' || phase === 'rays' || phase === 'pulse') && (
            <motion.path
              d={octagonPath}
              fill="none"
              stroke="#1E90FF"
              strokeWidth={1.5}
              strokeOpacity={0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={octagonControls}
              filter="url(#glow)"
            />
          )}

          {/* Rays to midpoints */}
          {phase === 'rays' || phase === 'pulse' ? (
            midPoints.map((point, index) => (
              <motion.line
                key={`ray-${index}`}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#1E90FF"
                strokeWidth={0.8}
                strokeOpacity={0.4}
                strokeLinecap="round"
                initial={{ opacity: 0, x2: center, y2: center }}
                animate={{
                  opacity: 1,
                  x2: point.x,
                  y2: point.y,
                }}
                transition={{
                  delay: phase === 'rays' ? index * 0.06 : 0,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                filter="url(#ray-glow)"
              />
            ))
          ) : null}

          {/* Central circle */}
          <motion.circle
            cx={center}
            cy={center}
            r="8"
            fill="url(#crystalGradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: [0.6, 0.7, 0.6],
            }}
            transition={{
              delay: 0.8,
              duration: 0.6,
              opacity: {
                duration: 4,
                repeat: Infinity,
                repeatType: 'reverse',
              }
            }}
            filter="url(#glow)"
          />
        </motion.g>
      </svg>
    </div>
  );
};

export default Octagram;
