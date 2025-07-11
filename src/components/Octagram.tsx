import React, { memo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback } from 'react';

const CENTRAL_RADIUS = 7.5;
const LEVELS_COUNT = 9;
const STROKE_COLOR = "#0FEE9E";
const STROKE_OPACITY = 0.15;
const STROKE_WIDTH = 0.5;
const GLOW_FILTER = "url(#glow)";
const RAY_GLOW_FILTER = "url(#ray-glow)";

interface OctagramProps {
  values: number[];
}

const Octagram = memo(({ values }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays' | 'pulse'>('vertices');
  const octagonControls = useAnimation();
  const crystalControls = useAnimation();
  const pulseControls = useAnimation();

  // Увеличиваем viewBox для предотвращения обрезания иконок
  const viewBoxSize = 340;
  const center = viewBoxSize / 2;
  const radius = viewBoxSize * 0.35; // Немного уменьшаем радиус
  const iconOffset = 42; // Увеличиваем отступ для иконок

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

  // Массив иконок для вершин октограммы
  const icons = useMemo(() => [
    // 1. Звезда (12 часов)
    <svg key="star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
    </svg>,
    // 2. Палитра (1:30)
    <svg key="palette" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" />
      <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </svg>,
    // 3. Группа пользователей (3 часа)
    <svg key="users-group" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
      <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M17 10h2a2 2 0 0 1 2 2v1" />
      <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
    </svg>,
    // 4. Лупа (4:30)
    <svg key="zoom" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </svg>,
    // 5. Череп (6 часов)
    <svg key="skull" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 4c4.418 0 8 3.358 8 7.5c0 1.901 -.755 3.637 -2 4.96l0 2.54a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-2.54c-1.245 -1.322 -2 -3.058 -2 -4.96c0 -4.142 3.582 -7.5 8 -7.5z" />
      <path d="M10 17v3" />
      <path d="M14 17v3" />
      <path d="M9 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </svg>,
    // 6. Тренд вниз (7:30)
    <svg key="trending-down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 7l6 6l4 -4l8 8" />
      <path d="M21 10l0 7l-7 0" />
    </svg>,
    // 7. Тренд вверх (9 часов)
    <svg key="trending-up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 17l6 -6l4 4l8 -8" />
      <path d="M14 7l7 0l0 7" />
    </svg>,
    // 8. Награда (10:30)
    <svg key="award" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
      <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
      <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
    </svg>
  ], []);

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
          fill="#0FEE9E"
          fillOpacity={0.2}
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

  // Рассчет позиций для иконок с увеличенным отступом
  const iconPositions = useMemo(() => {
    return octagonPoints.map(point => {
      const dx = point.x - center;
      const dy = point.y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = (distance + iconOffset) / distance;
      
      return {
        x: center + dx * scale,
        y: center + dy * scale
      };
    });
  }, [octagonPoints, center, iconOffset]);

  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      preserveAspectRatio="xMidYMid meet"
    >
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
          <stop offset="0%" stopColor="#0FEE9E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0FEE9E" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Статичные иконки (без анимации) */}
      {iconPositions.map((position, index) => (
        <g
          key={`icon-${index}`}
          transform={`translate(${position.x - 12}, ${position.y - 12})`}
        >
          {icons[index]}
        </g>
      ))}

      <motion.g animate={pulseControls}>
        {radialLevelsData.map(({ path, index }) => (
          <motion.path
            key={`level-${index}`}
            d={path}
            fill="none"
            stroke={STROKE_COLOR}
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
            fill={STROKE_COLOR}
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
            stroke={STROKE_COLOR}
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
            stroke={STROKE_COLOR}
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
          style={{ stroke: STROKE_COLOR, strokeWidth: 0.5 }}
        />
      </motion.g>
    </svg>
  );
});

export default Octagram;
