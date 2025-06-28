import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OctagramProps {
  values: number[]; // 8 значений от 0 до 1
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagram' | 'rays' | 'sectors'>('vertices');
  const octagramControls = useAnimation();

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

  const getMidPoints = (points: { x: number; y: number }[]) => {
    const midpoints = [];
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length;
      const x = (points[i].x + points[next].x) / 2;
      const y = (points[i].y + points[next].y) / 2;
      midpoints.push({ x, y });
    }
    return midpoints;
  };

  const createOctagramPath = (points: { x: number; y: number }[]) => {
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i <= 8; i++) {
      const nextIndex = (i * 3) % 8;
      path += ` L ${points[nextIndex].x},${points[nextIndex].y}`;
    }
    return path + ' Z';
  };

  const octagonPoints = getOctagonPoints();
  const midPoints = getMidPoints(octagonPoints);
  const octagramPath = createOctagramPath(octagonPoints);

  useEffect(() => {
    if (phase === 'vertices') {
      // Переход к следующей фазе после появления всех точек
      const totalDelay = 0.6 + values.length * 0.1 + 0.8;
      setTimeout(() => setPhase('octagram'), totalDelay * 1000);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'octagram') {
      octagramControls
        .start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 1.5, ease: 'easeInOut' },
        })
        .then(() => {
          setTimeout(() => setPhase('rays'), 1000);
        });
    }
  }, [phase]);

  const handleRaysComplete = () => {
    setTimeout(() => setPhase('sectors'), 500);
  };

  const createValueRays = () => {
    return midPoints.map((point, index) => (
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
          x2: point.x,
          y2: point.y,
        }}
        transition={{
          delay: index * 0.1,
          duration: 1.2,
          type: 'spring',
          damping: 12,
        }}
        onAnimationComplete={index === values.length - 1 ? handleRaysComplete : undefined}
        filter="url(#glow)"
      />
    ));
  };

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0077FF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Octagram path */}
        {phase === 'octagram' && (
          <motion.path
            d={octagramPath}
            fill="none"
            stroke="#00D4FF"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={octagramControls}
            filter="url(#glow)"
          />
        )}

        {/* Rays */}
        {phase === 'rays' && createValueRays()}

        {/* Cross-sector lines */}
        {phase === 'sectors' &&
          ['0', '45', '90', '135'].map((deg, index) => {
            const angle = parseFloat(deg);
            const start = getPoint(angle, radius);
            const end = getPoint(angle + 180, radius);

            return (
              <motion.line
                key={`cross-${index}`}
                x1={start.x}
                y1={start.y}
                x2={start.x}
                y2={start.y}
                stroke="#00D4FF"
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{
                  x2: end.x,
                  y2: end.y,
                  opacity: 0.4,
                }}
                transition={{
                  delay: 0.2 + index * 0.1,
                  duration: 1,
                  ease: 'easeInOut',
                }}
                filter="url(#glow)"
              />
            );
          })}

        {/* Vertices */}
        {octagonPoints.map((point, index) => (
          <motion.circle
            key={`vertex-${index}`}
            cx={point.x}
            cy={point.y}
            r="8"
            fill="#00D4FF"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{
              scale: [0, 1.3, 1],
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.6 + index * 0.1,
              duration: 0.8,
            }}
            filter="url(#glow)"
          />
        ))}

        {/* Central crystal with glowing hover effect */}
        <motion.polygon
          points={`
            ${center - 15},${center}
            ${center},${center - 15}
            ${center + 15},${center}
            ${center},${center + 15}
          `}
          fill="url(#crystalGradient)"
          initial={{ scale: 0, rotate: 0, opacity: 0.8 }}
          animate={{
            scale: 1,
            rotate: 360,
            opacity: [0.8, 1, 0.8],
          }}
          whileHover={{
            scale: 1.3,
            opacity: 1,
            filter: 'drop-shadow(0 0 10px #00D4FF)',
          }}
          transition={{
            delay: 1,
            duration: 8,
            rotate: {
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            },
            scale: {
              type: 'spring',
              stiffness: 300,
              damping: 20,
            },
          }}
          filter="url(#glow)"
          style={{ cursor: 'pointer' }}
        />
      </svg>
    </div>
  );
};

export default Octagram;
