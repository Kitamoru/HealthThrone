import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Hexagon3D } from './Hexagon3D';

interface OctalisysChartProps {
  factors: number[];
  factorNames: string[];
}

const FACTOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD166',
  '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4'
];

export const OctalisysChart: React.FC<OctalisysChartProps> = ({ factors, factorNames }) => {
  const normalizedFactors = useMemo(() => {
    return factors.map(factor => Math.max(0, Math.min(100, factor)));
  }, [factors]);

  return (
    <div className="octalisys-chart">
      <div className="octagon-3d-view">
        {normalizedFactors.map((value, index) => (
          <Hexagon3D 
            key={index}
            index={index}
            value={value}
            color={FACTOR_COLORS[index]}
          />
        ))}
      </div>
      
      <div className="factors-labels">
        {factorNames.map((name, i) => (
          <motion.div 
            key={i}
            className="factor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="factor-name">{name}</span>
            <div className="factor-value">{normalizedFactors[i]}%</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
