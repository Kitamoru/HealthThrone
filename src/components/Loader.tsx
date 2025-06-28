// components/Loader.tsx
import React, { useEffect } from 'react';

export function Loader() {
  // Блокируем прокрутку страницы при показе лоадера
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      backgroundColor: 'rgba(0, 0, 0, 0.95)', // Почти непрозрачный черный фон
      zIndex: 9999
    }}>
      <div style={{
        width: 'min(90%, 400px)',
        aspectRatio: '1/1',
        backgroundImage: 'url(/IMG_0413.png)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}></div>
    
      <style>{`
        @keyframes pulse {
          0% { 
            transform: scale(0.95); 
            opacity: 0.8; 
          }
          50% { 
            transform: scale(1.05); 
            opacity: 1; 
          }
          100% { 
            transform: scale(0.95); 
            opacity: 0.8; 
          }
        }
        
        /* Фикс для Safari */
        @supports (-webkit-touch-callout: none) {
          div {
            height: -webkit-fill-available;
          }
        }
      `}</style>
    </div>
  );
}
