'use client';

import React from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine'; // Импорт типа Engine

const ParticlesBackground = () => {
  const particlesInit = async (main: Engine) => {
    await loadSlim(main); // Загрузка slim-версии библиотеки
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false }, // Отключаем полноэкранный режим
        background: { color: { value: 'transparent' } }, // Прозрачный фон
        fpsLimit: 60, // Ограничение FPS
        particles: {
          color: { value: '#9be7ff' }, // Цвет частиц
          links: { enable: false }, // Выключение связей между частицами
          move: {
            direction: 'none', // Направление движения
            enable: true, // Включаем движение
            outModes: 'bounce', // Режим выхода частицы за границы экрана
            speed: 0.2, // Скорость перемещения
          },
          number: { value: 40 }, // Количество частиц
          opacity: {
            value: 0.5, // Начальная прозрачность
            animation: { enable: true, speed: 0.5, sync: false }, // Анимация прозрачности
          },
          shape: { type: 'circle' }, // Форма частиц (круг)
          size: {
            value: { min: 1, max: 3 }, // Диапазон размеров частиц
            animation: {
              enable: true, // Включаем анимацию размера
              speed: 3, // Скорость изменения размера
              minimumValue: 0.5, // Минимальное значение размера
              sync: false, // Не синхронизируем размеры частиц
            },
          },
        },
      }}
      style={{
        position: 'absolute',
        width: '100%', // Полная ширина
        height: '100%', // Полная высота
        zIndex: 0, // Низкий индекс слоя
      }}
    />
  );
};

export default ParticlesBackground;
