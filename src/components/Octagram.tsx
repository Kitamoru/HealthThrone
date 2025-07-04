import React, { memo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback } from 'react';

const CENTRAL_RADIUS = 7.5;
const LEVELS_COUNT = 9;
const STROKE_COLOR = "#0FEE9E"; // Изменен основной цвет
const STROKE_OPACITY = 0.15;
const STROKE_WIDTH = 0.5;
const GLOW_FILTER = "url(#glow)";
const RAY_GLOW_FILTER = "url(#ray-glow)";

interface OctagramProps {
  values: number[];
  size?: number;
}

const Octagram = memo(({ values, size = 300 }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays' | 'pulse'>('vertices');
  const octagonControls = useAnimation();
  const crystalControls = useAnimation();
  const pulseControls = useAnimation();

  const center = useMemo(() => size / 2, [size]);
  const radius = useMemo(() => size * 0.4, [size]);

  const getPoint = useCallback((angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  }, [center]);

  const getOctagonPointsByRadius = useCallback((r: number) => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = i * 45 - 90;
      return getPoint(angle, r);
    });
  }, [getPoint]);

  const octagonPoints = useMemo(() => 
    getOctagonPointsByRadius(radius), [radius, getOctagonPointsByRadius]
  );

  const midPoints = useMemo(() => {
    return octagonPoints.map((_, i) => {
      const nextIndex = (i + 1) % octagonPoints.length;
      return {
        x: (octagonPoints[i].x + octagonPoints[nextIndex].x) / 2,
        y: (octagonPoints[i].y + octagonPoints[nextIndex].y) / 2
      };
    });
  }, [octagonPoints]);

  const octagonPath = useMemo(() => {
    const [start, ...rest] = octagonPoints;
    return `M ${start.x},${start.y} ${rest.map(p => `L ${p.x},${p.y}`).join(' ')} Z`;
  }, [octagonPoints]);

  const radialLevelsData = useMemo(() => {
    return Array.from({ length: LEVELS_COUNT }, (_, index) => {
      const levelRadius = (radius * (index + 1)) / 10;
      const points = getOctagonPointsByRadius(levelRadius);
      const path = `M ${points[0].x},${points[0].y} ${points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')} Z`;
      return { path, index };
    });
  }, [radius, getOctagonPointsByRadius]);

  useEffect(() => {
    let timer1: NodeJS.Timeout, timer2: NodeJS.Timeout;

    if (phase === 'vertices') {
      crystalControls.start({
        scale: 1,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
      });
      
      timer1 = setTimeout(() => setPhase('octagon'), 600);
    } 
    else if (phase === 'octagon') {
      octagonControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeInOut' },
      }).then(() => {
        timer2 = setTimeout(() => setPhase('rays'), 800);
      });
    }
    else if (phase === 'rays') {
      setPhase('pulse');
      pulseControls.start({
        scale: [1, 1.03, 1],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    }

    return () => {
      timer1 && clearTimeout(timer1);
      timer2 && clearTimeout(timer2);
    };
  }, [phase, octagonControls, crystalControls, pulseControls]);

  const renderSectors = useCallback(() => {
    return values.map((value, index) => {
      if (value <= 0) return null;
      
      const startAngle = index * 45 - 90 - 22.5;
      const endAngle = startAngle + 45;
      const outerRadius = CENTRAL_RADIUS + (radius - CENTRAL_RADIUS) * value;
      
      const startInner = getPoint(startAngle, CENTRAL_RADIUS);
      const startOuter = getPoint(startAngle, outerRadius);
      const endOuter = getPoint(endAngle, outerRadius);
      const endInner = getPoint(endAngle, CENTRAL_RADIUS);
      
      const pathData = `
        M ${startInner.x},${startInner.y}
        L ${startOuter.x},${startOuter.y}
        A ${outerRadius} ${outerRadius} 0 0 1 ${endOuter.x},${endOuter.y}
        L ${endInner.x},${endInner.y}
        A ${CENTRAL_RADIUS} ${CENTRAL_RADIUS} 0 0 0 ${startInner.x},${startInner.y}
        Z
      `;
      
      return (
        <motion.path
          key={`sector-${index}`}
          d={pathData}
          fill="#0FEE9E" // Сплошной цвет вместо градиента
          fillOpacity={0.2} // Прозрачность 20%
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
          filter={GLOW_FILTER}
          style={{ stroke: STROKE_COLOR, strokeWidth: 0.5 }}
        />
      );
    });
  }, [values, radius, getPoint]);

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
            <stop offset="0%" stopColor="#0FEE9E" stopOpacity="0.8" /> {/* Обновленный цвет */}
            <stop offset="100%" stopColor="#0FEE9E" stopOpacity="0.2" /> {/* Обновленный цвет */}
          </linearGradient>
        </defs>

        <motion.g animate={pulseControls}>
          {radialLevelsData.map(({ path, index }) => (
            <motion.path
              key={`level-${index}`}
              d={path}
              fill="none"
              stroke={STROKE_COLOR} // Используем новый цвет
              strokeWidth={STROKE_WIDTH}
              strokeOpacity={STROKE_OPACITY}
              initial={{ pathLength: 0 }}
              animate={phase !== 'vertices' ? { pathLength: 1 } : {}}
              transition={{ 
                delay: index * 0.06, 
                duration: 0.5,
                ease: 'easeOut'
              }}
            />
          ))}

          {octagonPoints.map((point, index) => (
            <motion.circle
              key={`vertex-${index}`}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={STROKE_COLOR} // Используем новый цвет
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
              filter={GLOW_FILTER}
            />
          ))}

          {(phase === 'octagon' || phase === 'rays' || phase === 'pulse') && (
            <motion.path
              d={octagonPath}
              fill="none"
              stroke={STROKE_COLOR} // Используем новый цвет
              strokeWidth={1}
              strokeOpacity={0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={octagonControls}
              filter={GLOW_FILTER}
            />
          )}

          {phase === 'pulse' && renderSectors()}

          {(phase === 'rays' || phase === 'pulse') && midPoints.map((point, index) => (
            <motion.line
              key={`ray-${index}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke={STROKE_COLOR} // Используем новый цвет
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
              filter={RAY_GLOW_FILTER}
            />
          ))}

          <motion.circle
            cx={center}
            cy={center}
            r={CENTRAL_RADIUS}
            fill="url(#crystalGradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={crystalControls}
            filter={GLOW_FILTER}
            style={{ stroke: STROKE_COLOR, strokeWidth: 0.5 }} // Используем новый цвет
          />
        </motion.g>
      </svg>
    </div>
  );
});

export default Octagram;
