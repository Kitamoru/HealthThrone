import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { createClient } from '@supabase/supabase-js';

interface OctagramProps {
  values: number[]; // 8 values from 0 to 1
  size?: number;
  userId?: number; // Добавляем ID пользователя для запроса данных
}

const Octagram = ({ values, size = 300, userId }: OctagramProps) => {
  const [phase, setPhase] = useState<'vertices' | 'octagon' | 'rays' | 'pulse' | 'waves'>('vertices');
  const [waveData, setWaveData] = useState<number[] | null>(null);
  const octagonControls = useAnimation();
  const raysControls = useAnimation();
  const crystalControls = useAnimation();
  const pulseControls = useAnimation();
  const waveControls = useAnimation();
  const svgRef = useRef<SVGSVGElement>(null);

  const center = size / 2;
  const radius = size * 0.4;

  // Подключение к Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Получение данных из таблицы octalysis_factors
  useEffect(() => {
    if (!userId) return;

    const fetchWaveData = async () => {
      const { data, error } = await supabase
        .from('octalysis_factors')
        .select('factors1, factors2, factors3, factors4, factors5, factors6, factors7, factors8')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching octalysis factors:', error);
        return;
      }

      if (data && data.length > 0) {
        // Преобразуем данные в массив чисел и нормализуем значения
        const factors = Object.values(data[0]).map(Number);
        const normalizedFactors = factors.map(value => Math.min(1, Math.max(0, value / 100)));
        setWaveData(normalizedFactors);
      }
    };

    fetchWaveData();
  }, [userId]);

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

  // Создаем путь для волнообразной визуализации
  const createWavePath = (data: number[]) => {
    if (!svgRef.current) return '';

    const points = data.map((value, i) => {
      const angle = i * 45 - 90;
      const r = radius * value * 0.8; // Уменьшаем радиус для визуального удобства
      return getPoint(angle, r);
    });

    // Замыкаем путь, добавляя первую точку в конец
    points.push(points[0]);

    const lineGenerator = d3.line<{ x: number; y: number }>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCardinalClosed); // Сглаживаем кривую

    return lineGenerator(points) || '';
  };

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

  // Rays animation phase
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
          if (waveData) setPhase('waves');
        });
      }, 2000);
    }
  }, [phase, pulseControls, waveData]);

  // Wave animation phase
  useEffect(() => {
    if (phase === 'waves' && waveData) {
      waveControls.start({
        opacity: 1,
        pathLength: 1,
        transition: { duration: 2, ease: "easeOut" }
      });
    }
  }, [phase, waveControls, waveData]);

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size} ref={svgRef}>
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
            <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.2" />
          </linearGradient>

          {/* Градиент для волн */}
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B4DB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0083B0" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <motion.g animate={pulseControls}>
          {/* Вершины */}
          {octagonPoints.map((point, index) => (
            <motion.circle
              key={`vertex-${index}`}
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#1E90FF"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={
                phase !== 'vertices'
                  ? { scale: 1, opacity: 1, y: 0 }
                  : {
                      scale: [0, 1.3, 1],
                      opacity: 1,
                      y: 0,
                    }
              }
              transition={{
                delay: index * 0.1,
                duration: 0.8,
              }}
              filter="url(#glow)"
            />
          ))}

          {/* Восьмиугольник */}
          {(phase === 'octagon' || phase === 'rays' || phase === 'pulse' || phase === 'waves') && (
            <motion.path
              d={octagonPath}
              fill="none"
              stroke="#1E90FF"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={octagonControls}
              filter="url(#glow)"
            />
          )}

          {/* Лучи к серединам сторон */}
          {phase === 'rays' || phase === 'pulse' || phase === 'waves' ? (
            midPoints.map((point, index) => (
              <motion.line
                key={`ray-${index}`}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#1E90FF"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0, x2: center, y2: center }}
                animate={{
                  opacity: 1,
                  x2: point.x,
                  y2: point.y,
                }}
                transition={{
                  delay: phase === 'rays' ? index * 0.1 : 0,
                  duration: 1.0,
                  ease: 'easeOut',
                }}
                filter="url(#ray-glow)"
              />
            ))
          ) : null}

          {/* Волнообразная визуализация данных */}
          {waveData && phase === 'waves' && (
            <motion.path
              d={createWavePath(waveData)}
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="4"
              strokeLinejoin="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={waveControls}
              filter="url(#glow)"
            />
          )}

          {/* Центральный кристалл */}
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
        </motion.g>
      </svg>
    </div>
  );
};

export default Octagram;
