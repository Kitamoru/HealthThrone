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
  const crystalControls = useAnimation();
  const pulseControls = useAnimation();

  const center = size / 2;
  const radius = size * 0.4;

  const getPoint = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const getOctagonPointsByRadius = (r: number) => {
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = i * 45 - 90;
      points.push(getPoint(angle, r));
    }
    return points;
  };

  const getOctagonPoints = () => getOctagonPointsByRadius(radius);

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
      // Show central ball immediately
      crystalControls.start({
        scale: 1,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
      });
      
      setTimeout(() => setPhase('octagon'), 600);
    }
  }, [phase, crystalControls]);

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

  useEffect(() => {
    if (phase === 'rays') {
      setTimeout(() => {
        setPhase('pulse');
        pulseControls.start({
          scale: [1, 1.03, 1],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }).then(() => {
          crystalControls.start({
            scale: [1, 1.1, 1],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          });
        });
      }, 800);
    }
  }, [phase, pulseControls, crystalControls]);

  const renderRadialLevels = () => {
    const levels = 9;
    return Array.from({ length: levels }).map((_, index) => {
      const levelRadius = (radius * (index + 1)) / 10;
      const points = getOctagonPointsByRadius(levelRadius);
      const path = createOctagonPath(points);
      
      const strokeWidth = 0.5;
      const strokeOpacity = 0.15;
      const strokeColor = "#1E90FF";

      return (
        <motion.path
          key={`level-${index}`}
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          initial={{ pathLength: 0 }}
          animate={phase === 'rays' || phase === 'pulse' ? { pathLength: 1 } : {}}
          transition={{ 
            delay: index * 0.06, 
            duration: 0.5,
            ease: 'easeOut'
          }}
        />
      );
    });
  };

  // Fixed sector rendering to point at vertices
  const renderSectors = () => {
    return values.map((value, index) => {
      if (value <= 0) return null;
      
      // Calculate angles relative to vertices
      const startAngle = index * 45 - 90 - 22.5; // Offset to align with vertices
      const endAngle = startAngle + 45;
      
      const innerRadius = 10; // Fixed to match central ball size
      const outerRadius = innerRadius + (radius - innerRadius) * value;
      
      // Create sector path
      const startInner = getPoint(startAngle, innerRadius);
      const startOuter = getPoint(startAngle, outerRadius);
      const endOuter = getPoint(endAngle, outerRadius);
      const endInner = getPoint(endAngle, innerRadius);
      
      const pathData = `
        M ${startInner.x},${startInner.y}
        L ${startOuter.x},${startOuter.y}
        A ${outerRadius} ${outerRadius} 0 0 1 ${endOuter.x},${endOuter.y}
        L ${endInner.x},${endInner.y}
        A ${innerRadius} ${innerRadius} 0 0 0 ${startInner.x},${startInner.y}
        Z
      `;
      
      return (
        <motion.path
          key={`sector-${index}`}
          d={pathData}
          fill="url(#sector-gradient)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { 
              delay: 0.3 + index * 0.05, 
              duration: 0.5,
              ease: "easeOut"
            }
          }}
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
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="ray-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="sector-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <motion.g animate={pulseControls}>
          {renderRadialLevels()}

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
                  ? { 
                      scale: [1, 1.1, 1],
                      opacity: 1, 
                      y: 0 
                    }
                  : {
                      scale: [0, 1.3, 1],
                      opacity: 1,
                      y: 0,
                    }
              }
              transition={
                phase === 'vertices'
                  ? { delay: index * 0.06, duration: 0.4 }
                  : { 
                      scale: { 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      } 
                    }
              }
              filter="url(#glow)"
            />
          ))}

          {(phase === 'octagon' || phase === 'rays' || phase === 'pulse') && (
            <motion.path
              d={octagonPath}
              fill="none"
              stroke="#1E90FF"
              strokeWidth={1}
              strokeOpacity={0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={octagonControls}
              filter="url(#glow)"
            />
          )}

          {/* Render sectors in pulse phase */}
          {phase === 'pulse' && renderSectors()}

          {phase === 'rays' || phase === 'pulse' ? (
            midPoints.map((point, index) => (
              <motion.line
                key={`ray-${index}`}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#1E90FF"
                strokeWidth={0.7}
                strokeOpacity={0.15}
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

          {/* Central ball - now always visible from start */}
          <motion.circle
            cx={center}
            cy={center}
            r="7.5"
            fill="url(#crystalGradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={crystalControls}
            filter="url(#glow)"
          />
        </motion.g>
      </svg>
    </div>
  );
};

export default Octagram;
