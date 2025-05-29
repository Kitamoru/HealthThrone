
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
        {sprite ? (
          <img src={sprite} alt="Avatar" className="sprite" />
        ) : (
          <div className="sprite">😊</div>
        )}
      </div>
      
      <motion.div 
        className="pentagon"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3
        }}
      >
        🔥
      </motion.div>
      
      <div className="progress-wrapper">
        <div className="burnout-bar">
          <motion.div
            className="burnout-progress"
            initial={{ width: 0 }}
            animate={{ width: `${progressWidth}%` }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              delay: 0.5
            }}
          />
        </div>
      </div>
    </div>
  );
};
