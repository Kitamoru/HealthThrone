import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OctagramProps {
  values: number[]; // 8 values from 0 to 1
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  const [phase, setPhase] = useState<'rays' | 'octagram' | 'octagon' | 'sectors'>('rays');
  const octagramControls = useAnimation();
  const octagonControls = useAnimation();
  const crossControls = useAnimation();

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

  // Fixed: Renamed parameter to avoid conflict
  const createOctagramPath = (vertices: { x: number; y: number }[]) => {
    let path = `M ${vertices[0].x},${vertices[0].y}`;
    for (let i = 1; i <= 8; i++) {
      const nextIndex = (i * 3) % 8;
      path += ` L ${vertices[nextIndex].x},${vertices[nextIndex].y}`;
    }
    return path + ' Z';
  };

  // Fixed: Renamed parameter to avoid conflict
  const createOctagonPath = (vertices: { x: number; y: number }[]) => {
    let path = `M ${vertices[0].x},${vertices[0].y}`;
    for (let i = 1; i < vertices.length; i++) {
      path += ` L ${vertices[i].x},${vertices[i].y}`;
    }
    return path + ' Z';
  };

  const octagonPoints = getOctagonPoints();
  const octagramPath = createOctagramPath(octagonPoints);
  const octagonPath = createOctagonPath(octagonPoints);

  const handleRaysComplete = () => {
    setTimeout(() => setPhase('octagram'), 300);
  };

  useEffect(() => {
    if (phase === 'octagram') {
      octagramControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 1.5, ease: 'easeInOut' },
      }).then(() => {
        setTimeout(() => setPhase('octagon'), 1000);
      });
    }
  }, [phase, octagramControls]);

  useEffect(() => {
    if (phase === 'octagon') {
      octagonControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 1.5, ease: 'easeInOut' },
      }).then(() => {
        setTimeout(() => setPhase('sectors'), 500);
      });
    }
  }, [phase, octagonControls]);

  const createValueRays = () => {
    return values.map((_, index) => {
      const angle = index * 45 - 90;
      const point = getPoint(angle, radius);
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
      );
    });
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

        {/* Rays */}
        {createValueRays()}

        {/* Octagram path */}
        {phase !== 'octagon' && phase !== 'sectors' && (
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

        {/* Octagon path */}
        {(phase === 'octagon' || phase === 'sectors') && (
          <motion.path
            d={octagonPath}
            fill="none"
            stroke="#00D4FF"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={octagonControls}
            filter="url(#glow)"
          />
        )}

        {/* Cross-sector lines */}
        {phase === 'sectors' &&
          [0, 45, 90, 135].map((angle, index) => {
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
            animate={
              phase !== 'rays'
                ? {
                    scale: [0, 1.3, 1],
                    opacity: 1,
                    y: 0,
                  }
                : {}
            }
            transition={{
              delay: 0.6 + index * 0.1,
              duration: 0.8,
            }}
            filter="url(#glow)"
          />
        ))}

        {/* Central crystal */}
        <motion.polygon
          points={
            `${center - 15},${center} ` +
            `${center},${center - 15} ` +
            `${center + 15},${center} ` +
            `${center},${center + 15}`
          }
          fill="url(#crystalGradient)"
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: 1,
            rotate: 360,
            opacity: [0.8, 1, 0.8],
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
          }}
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

export default Octagram;
