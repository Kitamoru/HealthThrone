'use client';

import React from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from 'tsparticles-engine';

const ParticlesBackground = () => {
  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine);
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        particles: {
          color: { value: '#9be7ff' },
          links: { enable: false },
          move: {
            direction: 'none' as const, // Явное указание типа
            enable: true,
            outModes: { default: 'bounce' as const }, // Обновлено для v3
            speed: 0.2,
          },
          number: { value: 40 },
          opacity: {
            value: { min: 0.1, max: 0.5 }, // Обновлено для v3
            anim: { // Изменено с animation на anim
              enable: true,
              speed: 0.5,
            },
          },
          shape: { type: 'circle' },
          size: {
            value: { min: 1, max: 3 },
            anim: { // Изменено с animation на anim
              enable: true,
              speed: 3,
              minimumValue: 0.5,
              sync: false,
            },
          },
        },
        detectRetina: true, // Добавлено для улучшения отображения на Retina
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
