import { motion } from 'framer-motion';

interface OctagramProps {
  values: number[]; // 8 значений от 0 до 1
  size?: number;
}

const Octagram = ({ values, size = 300 }: OctagramProps) => {
  // Параметры октаграммы
  const center = size / 2;
  const outerRadius = size * 0.4;
  const innerRadius = outerRadius * 0.4;
  
  // Генерация вершин
  const getPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad)
    };
  };

  // Создание пути для октаграммы
  const createOctagramPath = () => {
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = i * 45 - 90;
      points.push(getPoint(angle, i % 2 === 0 ? outerRadius : innerRadius));
    }
    
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < 8; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    return path + ' Z';
  };

  // Генерация лучей для анимации значений
  const createValueRays = () => {
    return values.map((value, index) => {
      const angle = index * 45 - 90;
      const outerPoint = getPoint(angle, outerRadius);
      const innerPoint = getPoint(angle, innerRadius * 0.7);
      
      return (
        <motion.line
          key={`ray-${index}`}
          x1={center}
          y1={center}
          x2={innerPoint.x}
          y2={innerPoint.y}
          stroke="#00D4FF"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            x2: center + (outerPoint.x - center) * value,
            y2: center + (outerPoint.y - center) * value
          }}
          transition={{ 
            delay: index * 0.1,
            duration: 1.5,
            type: "spring",
            damping: 10
          }}
          filter="url(#glow)"
        />
      );
    });
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Фильтр для свечения */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Градиент для кристалла */}
          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0077FF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Основной контур */}
        <motion.path
          d={createOctagramPath()}
          fill="none"
          stroke="#00D4FF"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2 }}
          filter="url(#glow)"
        />
        
        {/* Анимированные лучи значений */}
        {createValueRays()}
        
        {/* Вершины с пульсацией */}
        {Array.from({ length: 8 }).map((_, index) => {
          const angle = index * 45 - 90;
          const point = getPoint(angle, outerRadius);
          
          return (
            <motion.circle
              key={`vertex-${index}`}
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#00D4FF"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: 1
              }}
              transition={{ 
                delay: 1.5 + index * 0.1,
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              filter="url(#glow)"
            />
          );
        })}
        
        {/* Центральный кристалл */}
        <motion.polygon
          points={`
            ${center - 15},${center} 
            ${center},${center - 15} 
            ${center + 15},${center} 
            ${center},${center + 15}
          `}
          fill="url(#crystalGradient)"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: 1,
            rotate: 360,
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            delay: 1,
            duration: 8,
            rotate: {
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

export default Octagram;
