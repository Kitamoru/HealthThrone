import React from 'react';

export function Loader() {
  return (
    <div style={{
      position: 'fixed', // Используем fixed вместо relative для полного покрытия
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      backgroundColor: '#131313', // Фолбек-цвет
      zIndex: 1000, // Убедимся что лоадер поверх других элементов
    }}>
      <div style={{
        width: 'min(80vw, 600px)', // Адаптивная ширина
        height: 'auto',
        minHeight: 80, // Минимальная высота
        position: 'relative',
        backgroundImage: `url(${process.env.PUBLIC_URL}/IMG_0413.jpg)`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundColor: 'transparent', // Убираем возможную заливку
        animation: 'pulse 1.5s infinite ease-in-out'
      }}></div>
      
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.9; }
          }
        `}
      </style>
    </div>
  );
}
