
import { motion } from 'framer-motion';

export const Loader: React.FC = () => {
  return (
    <div className="loader">
      <motion.div
        className="loader-spinner"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <p>Загрузка...</p>
    </div>
  );
};
