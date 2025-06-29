import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OctagramProps {
  values: number[]; // 8 values from 0 to 1
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays'>('vertices');
  const octagonControls = useAnimation();
  const raysControls = useAnimation();
  const crystalControls = useAnimation();

  const center = size / 2;
  const radius = size * 0.4;

  const getPoint = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const getOctagonPoints = () => {
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = i * 45 - 90;
      points.push(getPoint(angle, radius));
    }
    return points;
  };

  const createOctagonPath = (vertices: { x: number; y: number }[]) => {
    let path = `M ${vertices[0].x},${vertices[0].y}`;
    for (let i = 1; i < vertices.length; i++) {
      path += ` L ${vertices[i].x},${vertices[i].y}`;
    }
    return path + ' Z';
  };

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

  useEffect(() => {
    if (phase === 'vertices') {
      setTimeout(() => setPhase('octagon'), 8 * 100 + 800);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'octagon') {
      octagonControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 1.5, ease: 'easeInOut' },
      }).then(() => {
        setPhase('rays');
      });
    }
  }, [phase, octagonControls]);

  // Цветовая схема: голубые тона
  const blueColors = ["#1E90FF", "#00BFFF", "#00FFFF", "#1E90FF"];
  const gradientTransition = {
    duration: 6,
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          {/* Улучшенный фильтр свечения */}
          <filter id="magic-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="2" intercept="0"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Градиент для лучей */}
          <linearGradient id="ray-gradient" gradientTransform="rotate(90)">
            <motion.stop
              offset="0%"
              stopColor="#1E90FF"
              animate={{ stopColor: blueColors }}
              transition={gradientTransition}
            />
            <motion.stop
              offset="100%"
              stopColor="#00FFFF"
              animate={{ stopColor: [...blueColors].reverse() }}
              transition={{ ...gradientTransition, delay: 2 }}
            />
          </linearGradient>

          {/* Градиент для вершин */}
          <radialGradient id="vertex-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <motion.stop
              offset="0%"
              stopColor="#1E90FF"
              animate={{ stopColor: blueColors }}
              transition={gradientTransition}
            />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Градиент для центрального кристалла */}
          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              stopColor="#00BFFF"
              animate={{ stopColor: blueColors }}
              transition={gradientTransition}
            />
            <motion.stop
              offset="100%"
              stopColor="#00FFFF"
              animate={{ stopColor: [...blueColors].reverse() }}
              transition={{ ...gradientTransition, delay: 3 }}
            />
          </linearGradient>
        </defs>

        {/* Вершины с двойным свечением */}
        {octagonPoints.map((point, index) => (
          <g key={`vertex-${index}`}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="url(#vertex-glow)"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                phase !== 'vertices'
                  ? { scale: 1, opacity: 1 }
                  : {
                      scale: [0, 1.3, 1],
                      opacity: 1,
                    }
              }
              transition={{
                delay: index * 0.1,
                duration: 0.8,
              }}
              filter="url(#magic-glow)"
            />
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#1E90FF"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                phase !== 'vertices'
                  ? { scale: 1, opacity: 1 }
                  : {
                      scale: [0, 1.3, 1],
                      opacity: 1,
                    }
              }
              transition={{
                delay: index * 0.1,
                duration: 0.8,
              }}
            />
          </g>
        ))}

        {/* Анимированный восьмиугольник */}
        {(phase === 'octagon' || phase === 'rays') && (
          <motion.path
            d={octagonPath}
            fill="none"
            stroke="url(#ray-gradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={octagonControls}
            filter="url(#magic-glow)"
          />
        )}

        {/* Лучи с анимированным градиентом */}
        {phase === 'rays' && midPoints.map((point, index) => (
          <motion.line
            key={`ray-${index}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="url(#ray-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0, x2: center, y2: center }}
            animate={{
              opacity: 1,
              x2: point.x,
              y2: point.y,
            }}
            transition={{
              delay: index * 0.1,
              duration: 1.0,
              ease: 'easeOut',
            }}
            filter="url(#magic-glow)"
          />
        ))}

        {/* Центральный кристалл с анимацией */}
        <motion.polygon
          points={
            `${center - 15},${center} ` +
            `${center},${center - 15} ` +
            `${center + 15},${center} ` +
            `${center},${center + 15}`
          }
          fill="url(#crystalGradient)"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: 360,
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            delay: 1.5,
            scale: {
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse' as const,
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse' as const,
            },
            rotate: {
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }
          }}
          filter="url(#magic-glow)"
        />
      </svg>
    </div>
  );
};

export default Octagram;
