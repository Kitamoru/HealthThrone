import React from 'react';

interface OctagramProps {
  values: number[];
  size?: number;
}

const CENTRAL_RADIUS = 7.5;
const LEVELS_COUNT = 9;
const STROKE_COLOR = "#0FEE9E";
const STROKE_OPACITY = 0.15;
const STROKE_WIDTH = 0.5;

const OctagramStatic: React.FC<OctagramProps> = ({ 
  values, 
  size = 280 
}) => {
  const viewBoxSize = 340;
  const center = viewBoxSize / 2;
  const radius = viewBoxSize * 0.35;
  
  // Функция для вычисления точки по углу и радиусу
  const getPoint = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  // Вычисляем точки для октаграммы
  const getOctagonPointsByRadius = (r: number) => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = i * 45 - 90;
      return getPoint(angle, r);
    });
  };

  const octagonPoints = getOctagonPointsByRadius(radius);
  const midPoints = octagonPoints.map((_, i) => {
    const nextIndex = (i + 1) % octagonPoints.length;
    return {
      x: (octagonPoints[i].x + octagonPoints[nextIndex].x) / 2,
      y: (octagonPoints[i].y + octagonPoints[nextIndex].y) / 2
    };
  });

  const octagonPath = `M ${octagonPoints[0].x},${octagonPoints[0].y} ${octagonPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')} Z`;

  // Радиальные уровни
  const radialLevelsData = Array.from({ length: LEVELS_COUNT }, (_, index) => {
    const levelRadius = (radius * (index + 1)) / 10;
    const points = getOctagonPointsByRadius(levelRadius);
    return `M ${points[0].x},${points[0].y} ${points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')} Z`;
  });

  // Рассчитываем сектора (заполнение) для каждого значения
  const renderSectors = () => {
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
        <path
          key={`sector-${index}`}
          d={pathData}
          fill="#0FEE9E"
          fillOpacity={0.2}
          stroke={STROKE_COLOR}
          strokeWidth={0.5}
        />
      );
    });
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0FEE9E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0FEE9E" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Радиальные уровни (концентрические восьмиугольники) */}
      {radialLevelsData.map((path, index) => (
        <path
          key={`level-${index}`}
          d={path}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeOpacity={STROKE_OPACITY}
        />
      ))}

      {/* Внешний восьмиугольник */}
      <path
        d={octagonPath}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={1}
        strokeOpacity={0.8}
      />

      {/* Сектора (заполнение) */}
      {renderSectors()}

      {/* Лучи от центра к серединам сторон */}
      {midPoints.map((point, index) => (
        <line
          key={`ray-${index}`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke={STROKE_COLOR}
          strokeWidth={0.7}
          strokeOpacity={0.15}
          strokeLinecap="round"
        />
      ))}

      {/* Вершины (точки) */}
      {octagonPoints.map((point, index) => (
        <circle
          key={`vertex-${index}`}
          cx={point.x}
          cy={point.y}
          r="6"
          fill={STROKE_COLOR}
        />
      ))}

      {/* Центральный круг */}
      <circle
        cx={center}
        cy={center}
        r={CENTRAL_RADIUS}
        fill="url(#crystalGradient)"
        stroke={STROKE_COLOR}
        strokeWidth={0.5}
      />
    </svg>
  );
};

export default OctagramStatic;
