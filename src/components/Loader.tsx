import React, { useEffect, useState } from 'react';

export function Loader() {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: bgColor, // Используем цвет из состояния
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease' // Плавное изменение цвета
    }}>
      <div style={{
        width: '100%', // Растягиваем на всю ширину контейнера
        maxWidth: '600px', // Ограничиваем максимальную ширину
        aspectRatio: '300/80', // Сохраняем пропорции оригинала (300x80)
        position: 'relative',
        backgroundImage: 'url(/IMG_123.jpg)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}></div>
      
      {/* CSS анимация */}
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
