import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OctagramProps {
  values: number[]; // 8 values from 0 to 1
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays'>('vertices');
  const [pulsing, setPulsing] = useState(false);
  const octagonControls = useAnimation();
  const raysControls = useAnimation();
  const crystalControls = useAnimation();

  const center = size / 2;
  const radius = size * 0.4;

  // Base colors
  const BASE_COLOR = "#8B0000";
  const GLOW_COLOR = "#FF4500";
  const CRYSTAL_COLOR_1 = "#8B0000";
  const CRYSTAL_COLOR_2 = "#FF4500";

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
      setTimeout(() => setPhase('octagon'), 8 * 100 + 800);
    }
  }, [phase]);

  // Octagon animation phase
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

  // Pulsing effect activation
  useEffect(() => {
    if (phase === 'rays') {
      const timer = setTimeout(() => {
        setPulsing(true);
        
        // Start pulsing animations
        octagonControls.start({
          stroke: [BASE_COLOR, GLOW_COLOR, BASE_COLOR],
          transition: { repeat: Infinity, duration: 2 }
        });
        
        crystalControls.start({
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.1, 1],
          transition: { 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }
        });
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setPulsing(false);
    }
  }, [phase, octagonControls, crystalControls]);

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

          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={CRYSTAL_COLOR_1} stopOpacity="0.8" />
            <stop offset="100%" stopColor={CRYSTAL_COLOR_2} stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={BASE_COLOR} />
            <stop offset="100%" stopColor={GLOW_COLOR} />
          </linearGradient>
        </defs>

        {/* Vertices */}
        {octagonPoints.map((point, index) => (
          <motion.circle
            key={`vertex-${index}`}
            cx={point.x}
            cy={point.y}
            r="8"
            fill={pulsing ? GLOW_COLOR : BASE_COLOR}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={
              phase !== 'vertices'
                ? { 
                    scale: pulsing ? [1, 1.2, 1] : 1,
                    opacity: 1,
                    y: 0
                  }
                : {
                    scale: [0, 1.3, 1],
                    opacity: 1,
                    y: 0,
                  }
            }
            transition={{
              delay: index * 0.1,
              duration: 0.8,
              scale: pulsing 
                ? { repeat: Infinity, duration: 2, ease: "easeInOut" } 
                : undefined
            }}
            filter="url(#glow)"
          />
        ))}

        {/* Octagon */}
        {(phase === 'octagon' || phase === 'rays') && (
          <motion.path
            d={octagonPath}
            fill="none"
            stroke={BASE_COLOR}
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
            stroke={pulsing ? "url(#pulseGradient)" : BASE_COLOR}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ opacity: 0, x2: center, y2: center }}
            animate={{
              opacity: 1,
              x2: point.x,
              y2: point.y,
              stroke: pulsing 
                ? [BASE_COLOR, GLOW_COLOR, BASE_COLOR] 
                : BASE_COLOR
            }}
            transition={{
              delay: index * 0.1,
              duration: 1.0,
              ease: 'easeOut',
              stroke: pulsing 
                ? { repeat: Infinity, duration: 2, ease: "easeInOut" } 
                : undefined
            }}
            filter="url(#ray-glow)"
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
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={crystalControls}
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

export default Octagram;
