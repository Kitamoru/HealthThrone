import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './MagicProgressBar.module.css';

interface Props {
  duration?: number;
}

const MagicProgressBar: React.FC<Props> = ({ duration = 3000 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.min(100, (elapsed / duration) * 100);
      setProgress(percent);
      if (percent >= 100) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <div className={styles.barOuter}>
        <motion.div
          className={styles.barInner}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
        <motion.div
          className={styles.spark}
          animate={{ left: `${progress}%` }}
        />
      </div>
      <motion.p
        className={styles.text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {Math.floor(progress)}%
      </motion.p>
    </motion.div>
  );
};

export default MagicProgressBar;
