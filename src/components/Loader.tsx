import React from 'react';
import MagicProgressBar from './MagicProgressBar';
import ParticlesBackground from './ParticlesBackground';

export default function LoaderScreen() {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0b0c1d',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    }}>
      <ParticlesBackground />
      <MagicProgressBar duration={5000} />
    </div>
  );
}
