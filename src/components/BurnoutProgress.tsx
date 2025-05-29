
import React from 'react';
import { motion } from 'framer-motion';

interface BurnoutProgressProps {
  level: number;
  sprite?: string;
}

export const BurnoutProgress: React.FC<BurnoutProgressProps> = ({ level, sprite }) => {
  const progressWidth = (level / 10) * 100;
  
  return (
    <div className="header">
      <div className="sprite-container">
        <img 
          src="/sprite.gif" 
          alt="Red Panda Avatar" 
          className="sprite"
        />
      </div>
      
      <motion.div 
        className="pentagon"
        animate={{ rotate: level > 7 ? [0, 10, -10, 0] : 0 }}
        transition={{ duration: 0.5, repeat: level > 7 ? Infinity : 0 }}
      >
        🔥
      </motion.div>
      
      <div className="progress-wrapper">
        <div className="burnout-bar">
          <motion.div
            className="burnout-progress"
            initial={{ width: 0 }}
            animate={{ width: `${progressWidth}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};
