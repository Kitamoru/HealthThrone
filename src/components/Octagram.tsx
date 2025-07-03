import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OctagramProps {
  values: number[]; // 8 values from 0 to 1
  size?: number;
  isLoading?: boolean;
}

const Octagram = ({ values, size = 300, isLoading = false }: OctagramProps) => {
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

  const getOctagonPointsByRadius = (r: number) =>
    Array.from({ length: 8 }, (_, i) => getPoint(i * 45 - 90, r));

  const getMidPoints = (vertices: { x: number; y: number }[]) =>
    vertices.map((p, i) => {
      const next = vertices[(i + 1) % vertices.length];
      return { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 };
    });

  const createOctagonPath = (vertices: { x: number; y: number }[]) =>
    `M ${vertices.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  const octagonPoints = getOctagonPointsByRadius(radius);
  const midPoints = getMidPoints(octagonPoints);
  const octagonPath = createOctagonPath(octagonPoints);

  // === Анимационные фазы ===

  useEffect(() => {
    if (isLoading) return;

    const resetAnimation = async () => {
      setPhase('vertices');
      await octagonControls.set({ pathLength: 0, opacity: 0 });
      await raysControls.set({ opacity: 0 });
      await crystalControls.set({ scale: 0, opacity: 0 });
      await pulseControls.set({ scale: 1 });
    };

    resetAnimation();
  }, [values, isLoading]);

  useEffect(() => {
    if (phase === 'vertices' && !isLoading) {
      const timeout = setTimeout(() => setPhase('octagon'), 500);
      return () => clearTimeout(timeout);
    }
  }, [phase, isLoading]);

  useEffect(() => {
    if (phase === 'octagon' && !isLoading) {
      octagonControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.6 },
      }).then(() => setPhase('rays'));
    }
  }, [phase, octagonControls, isLoading]);

  useEffect(() => {
    if (phase === 'rays' && !isLoading) {
      setTimeout(() => {
        setPhase('pulse');
        pulseControls.start({
          scale: [1, 1.03, 1],
          transition: { duration: 3, repeat: Infinity }
        });
        crystalControls.start({
          scale: [1, 1.1, 1],
          transition: { duration: 2, repeat: Infinity }
        });
      }, 800);
    }
  }, [phase, pulseControls, crystalControls, isLoading]);

  const renderRadialLevels = () =>
    Array.from({ length: 9 }).map((_, i) => {
      const r = radius * ((i + 1) / 10);
      const path = createOctagonPath(getOctagonPointsByRadius(r));
      return (
        <motion.path
          key={i}
          d={path}
          fill="none"
          stroke="#1E90FF"
          strokeWidth={0.5}
          strokeOpacity={0.15}
          initial={{ pathLength: 0 }}
          animate={(phase === 'rays' || phase === 'pulse') ? { pathLength: 1 } : {}}
          transition={{ delay: i * 0.06, duration: 0.5 }}
        />
      );
    });

  const renderSectors = () =>
    values.map((value, i) => {
      if (value < 0.01) return null;
      const angleStart = i * 45 - 90;
      const angleEnd = (i + 1) * 45 - 90;
      const rInner = radius * 0.1;
      const rOuter = rInner + radius * 0.8 * value;
      const p1 = getPoint(angleStart, rInner);
      const p2 = getPoint(angleStart, rOuter);
      const p3 = getPoint(angleEnd, rOuter);
      const p4 = getPoint(angleEnd, rInner);
      const d = `M ${p1.x},${p1.y} L ${p2.x},${p2.y} A ${rOuter} ${rOuter} 0 0 1 ${p3.x},${p3.y} L ${p4.x},${p4.y} A ${rInner} ${rInner} 0 0 0 ${p1.x},${p1.y} Z`;

      return (
        <motion.path
          key={i}
          d={d}
          fill="url(#sector-gradient)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
          filter="url(#glow)"
        />
      );
    });

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="sector-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <motion.g animate={pulseControls}>
          {renderRadialLevels()}
          {octagonPoints.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#1E90FF"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{
                scale: [0, 1.3, 1],
                opacity: 1,
                y: 0
              }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              filter="url(#glow)"
            />
          ))}

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

          {!isLoading && renderSectors()}

          {(phase === 'rays' || phase === 'pulse') && midPoints.map((p, i) => (
            <motion.line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#1E90FF"
              strokeWidth={0.7}
              strokeOpacity={0.15}
              strokeLinecap="round"
              initial={{ opacity: 0, x2: center, y2: center }}
              animate={{ opacity: 1, x2: p.x, y2: p.y }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            />
          ))}

          <motion.circle
            cx={center}
            cy={center}
            r="7.5"
            fill="url(#sector-gradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={crystalControls}
            transition={{ delay: 0.8, duration: 0.6 }}
            filter="url(#glow)"
          />
        </motion.g>
      </svg>
    </div>
  );
};

export default Octagram;
