'use client';

import React, { useEffect } from 'react';
import Particles from '@tsparticles/react';
import { loadFull } from '@tsparticles/engine';

// Убираем ненужный import типа Engine

const ParticlesBackground = () => {
  useEffect(() => {
    // Инициализация частиц сразу в useEffect()
    async function init() {
      await loadFull();
    }
    init(); // Запускаем загрузку библиотеки
  }, []);

  return (
    <Particles
      id="tsparticles"
      options={{
        fullScreen: { enable: false },
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        particles: {
          color: { value: '#9be7ff' },
          links: { enable: false },
          move: {
            direction: 'none',
            enable: true,
            outModes: 'bounce',
            speed: 0.2,
          },
          number: { value: 40 },
          opacity: {
            value: 0.5,
            animation: { enable: true, speed: 0.5, sync: false },
          },
          shape: { type: 'circle' },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 3,
              sync: false,
            },
          },
        },
      }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
};

export default ParticlesBackground;
