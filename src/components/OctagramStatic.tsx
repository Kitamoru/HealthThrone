import React from 'react';
import { motion } from 'framer-motion';

interface OctagramProps {
  values: number[];
}

const CENTRAL_RADIUS = 7.5;
const LEVELS_COUNT = 9;
const STROKE_COLOR = "#0FEE9E";
const STROKE_OPACITY = 0.15;
const STROKE_WIDTH = 0.5;

const OctagramStatic: React.FC<OctagramProps> = ({ values }) => {
  // Размеры из Octagram.tsx
  const viewBoxSize = 340;
  const center = viewBoxSize / 2;
  const radius = viewBoxSize * 0.35;
  const iconOffset = 24;

  // Тексты для алертов
  const alertTexts = [
    "Эпическое предназначение\n\nТы — часть легенды, что творится ради великой цели! Твои деяния вплетаются в ткань мира.\n\nЕсли звезда меркнет:\nИщи смысл в каждом квесте, спроси у лидеров, как твои подвиги влияют на других, и запроси награду за свои подвиги.",
    "Путь триумфа\n\nС каждым шагом ты становишься сильнее!\nСледи за трофеями и отмечай, как растёт твоя слава.\n\nЕсли звезда меркнет:\nРаздели квесты на малые подвиги, веди летопись свершений и награждай себя за каждый пройденный этап.",
    "Искры гениальности\n\nСоздавай новые заклинания и прислушивайся к гласу соратников.\n\nЕсли звезда меркнет:\nПробуй неизведанные пути, делись своими чарами с другими и взывай к их мудрости за советом.",
    "Власть над судьбой\n\nТы — кузнец своей истории, держи поводья своих квестов!\n\nЕсли звезда меркнет:\nПроси у старейшин больше свободы в заданиях, придай своим делам уникальный отпечаток.",
    "Братство героев\n\nСражайся плечом к плечу с товарищами, делись славой и укрепляй узы.\n\nЕсли звезда меркнет:\nВступай в обсуждения с соратниками, участвуй в общем совете или собирайся у костра для бесед.",
    "Пламя срочности\n\nКаждый квест имеет час испытания! Пусть огонь дедлайнов подстёгивает тебя.\n\nЕсли звезда меркнет:\nУстанавливай собственные сроки, напоминай себе, как важна быстрота, чтобы не упустить добычу.",
    "Тайна и загадка\n\nПусть каждый день скрывает сюрприз, достойный древних легенд!\n\nЕсли звезда меркнет:\nИсследуй новые тропы в рутине, ввязывайся в неожиданные квесты, чтобы пробудить свое любопытство.",
    "Тень неудачи\n\nПомни, что бездействие может привести к потере сокровищ и славы.\n\nЕсли звезда меркнет:\nЧётко представь, какие трофеи ты можешь утратить, и используй этот страх как факел, ведущий к победе."
  ];

  // Массив иконок для вершин октограммы
  const icons = [
    // 1. Звезда (12 часов)
    <svg 
      key="star" 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none"
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ overflow: 'visible' }}
    >
      <path 
        stroke="#FFFFFF"
        strokeWidth="1" 
        d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"
      />
    </svg>,
    
    // 2. Палитра (1:30)
    <svg key="palette" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" />
      <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </svg>,
    
    // 3. Группа пользователей (3 часа)
    <svg key="users-group" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
      <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M17 10h2a2 2 0 0 1 2 2v1" />
      <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
    </svg>,
    
    // 4. Лупа (4:30)
    <svg key="zoom" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </svg>,
    
    // 5. Череп (6 часов)
    <svg key="skull" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 4c4.418 0 8 3.358 8 7.5c0 1.901 -.755 3.637 -2 4.96l0 2.54a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-2.54c-1.245 -1.322 -2 -3.058 -2 -4.96c0 -4.142 3.582 -7.5 8 -7.5z" />
      <path d="M10 17v3" />
      <path d="M14 17v3" />
      <path d="M9 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </svg>,
    
    // 6. Тренд вниз (7:30)
    <svg key="trending-down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 7l6 6l4 -4l8 8" />
      <path d="M21 10l0 7l-7 0" />
    </svg>,
    
    // 7. Тренд вверх (9 часов)
    <svg key="trending-up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 17l6 -6l4 4l8 -8" />
      <path d="M14 7l7 0l0 7" />
    </svg>,
    
    // 8. Награда (10:30)
    <svg key="award" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
      <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
      <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
    </svg>
  ];

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

  // Рассчет позиций для иконок с отступом
  const iconPositions = octagonPoints.map(point => {
    const dx = point.x - center;
    const dy = point.y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = (distance + iconOffset) / distance;
    
    return {
      x: center + dx * scale,
      y: center + dy * scale
    };
  });

  return (
    <svg 
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0FEE9E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0FEE9E" stopOpacity="0.2" />
        </linearGradient>
        
        {/* Фильтр для свечения */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Радиальные уровни */}
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
        filter="url(#glow)"
      />

      {/* Сектора */}
      {renderSectors()}

      {/* Лучи */}
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

      {/* Вершины */}
      {octagonPoints.map((point, index) => (
        <circle
          key={`vertex-${index}`}
          cx={point.x}
          cy={point.y}
          r="6"
          fill={STROKE_COLOR}
          filter="url(#glow)"
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
        filter="url(#glow)"
      />

      {/* Иконки с алертами */}
      {iconPositions.map((position, index) => (
        <g
          key={`icon-${index}`}
          transform={`translate(${position.x - 12}, ${position.y - 12})`}
          onClick={() => alert(alertTexts[index])}
          style={{ cursor: 'pointer' }}
        >
          {/* Прозрачная область для клика */}
          <rect 
            x="0" 
            y="0" 
            width="24" 
            height="24" 
            fill="transparent" 
          />
          
          {/* Ripple-анимация для звезды (первой иконки) */}
          {index === 0 && (
            <motion.circle
              cx={12}
              cy={12}
              r={8}
              fill="#0FEE9E"
              initial={{ 
                scale: 0.5,
                opacity: 0.4 
              }}
              animate={{
                scale: 1.8,
                opacity: 0,
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}
          
          {icons[index]}
        </g>
      ))}
    </svg>
  );
};

export default OctagramStatic;
