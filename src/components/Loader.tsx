import React from 'react';

export function Loader() {
  return (
    <div style={{
      position: 'fixed', // Используем fixed вместо relative
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      backgroundColor: 'transparent',
      zIndex: 9999
    }}>
      <div style={{
        width: 'min(90%, 400px)', // Адаптивная ширина с ограничением
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
