'use client';

import React from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from 'tsparticles-engine';

const ParticlesBackground = () => {
  const particlesInit = async (main: Engine) => {
    await loadSlim(main);
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
            direction: 'none',
            enable: true,
            outModes: 'bounce',
            speed: 0.2,
          },
          number: { value: 40 },
          opacity: {
            value: 0.5,
            animation: { enable: true, speed: 0.5, minimumValue: 0.1 },
          },
          shape: { type: 'circle' },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 3,
              minimumValue: 0.5,
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
