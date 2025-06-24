import React from 'react';

export function Loader() {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      backgroundColor: '#f0f2f5',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '512px',
        aspectRatio: '1/1',
        position: 'relative',
        backgroundImage: 'url(/IMG_0413.png)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}></div>
      
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
          
          /* Адаптация для очень маленьких экранов */
          @media (max-width: 480px) {
            div > div {
              width: 95%;
              max-width: 95%;
            }
          }
        `}
      </style>
    </div>
  );
}
