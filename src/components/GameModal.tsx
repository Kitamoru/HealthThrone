import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: string | number;
  username?: string;
  firstName?: string;
}

export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  telegramId,
  username,
  firstName,
}) => {
  // Блокируем скролл страницы пока модалка открыта
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const params = new URLSearchParams();
  params.set('telegramId', String(telegramId));
  if (username) params.set('username', username);
  if (firstName) params.set('firstName', firstName);

  const gameUrl = `https://dnd-runner.vercel.app?${params.toString()}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Заголовок с кнопкой закрытия */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: '#0D0B12',
              borderBottom: '1px solid #6226B3',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#6226B3', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              ⚔️ PixelDungeon Dash
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* iframe с игрой */}
          <iframe
            src={gameUrl}
            style={{
              flex: 1,
              width: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay"
            title="PixelDungeon Dash"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
