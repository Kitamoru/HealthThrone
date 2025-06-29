import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { animated as a, useSpring } from '@react-spring/web';
import gsap from 'gsap';

interface OctagramProps {
  values: number[];
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

  const springConfig = { mass: 1, tension: 70, friction: 15 };
  const springs = octagonPoints.map((_, idx) => {
    return useSpring({
      config: springConfig,
      r: 8 + (Math.random() * 3 - 1.5),
      loop: true,
      reset: false,
    });
  });

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

  useEffect(() => {
    const tl = gsap.timeline();
    tl.to('#startGradient', {
      attr: {
        'stop-color': ['#00D4FF', '#FF00DD'],
        'stop-opacity': ['1', '1']
      },
      duration: 5,
      yoyo: true,
      repeat: -1,
    });
  }, []);

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="ray-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="1"/>
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="1"/>
          </linearGradient>

          <linearGradient id="endGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF00DD" stopOpacity="1"/>
            <stop offset="100%" stopColor="#FFAAEE" stopOpacity="1"/>
          </linearGradient>

          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#483D8B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#483D8B" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Vertices with random pulsation */}
        {octagonPoints.map((point, index) => (
          <a.circle
            key={`vertex-${index}`}
            cx={point.x}
            cy={point.y}
            r={springs[index].r} // Используем пружину для каждого кружка
            fill="#483D8B"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.1,
              duration: 0.8,
            }}
            filter="url(#glow)"
          />
        ))}

        {/* Octagon */}
        {(phase === 'octagon' || phase === 'rays') && (
          <motion.path
            d={octagonPath}
            fill="none"
            stroke="url(#startGradient)" // Применяем первый градиент
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={octagonControls}
            filter="url(#glow)"
          />
        )}

        {/* Rays to midpoints */}
        {phase === 'rays' && midPoints.map((point, index) => (
          <motion.line
            key={`ray-${index}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="#483D8B"
            strokeWidth="2"
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
            filter="url(#ray-glow)"
          />
        ))}

        {/* Central crystal */}
        <motion.polygon
          points={`${center - 15},${center} ${center},${center - 15} ${center + 15},${center} ${center},${center + 15}`}
          fill="url(#crystalGradient)"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: 1,
            rotate: 360,
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            delay: 1.5,
            duration: 1.0,
            opacity: {
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            },
            rotate: {
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }
          }}
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

export default Octagram;
