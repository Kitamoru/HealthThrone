import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Временный простой лоадер
const Loader = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    color: 'white',
    fontSize: '24px',
    zIndex: 1000
  }}>
    Loading...
  </div>
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, isTelegramReady } = useTelegram();
  const [appState, setAppState] = useState('uninitialized');
  const [error, setError] = useState('');
  const initialized = useRef(false);
  
  // Диагностический лог
  useEffect(() => {
    console.group('App Status');
    console.log('isTelegramReady:', isTelegramReady);
    console.log('initData:', initData);
    console.log('appState:', appState);
    console.log('error:', error);
    console.groupEnd();
  }, [isTelegramReady, initData, appState, error]);

  useEffect(() => {
    if (!isTelegramReady || initialized.current) return;
    initialized.current = true;

    console.log('Starting initialization...');
    
    // Имитация успешной инициализации через 3 секунды
    const timeout = setTimeout(() => {
      console.warn('FORCE SETTING AUTHENTICATED STATE');
      setAppState('authenticated');
    }, 3000);

    // Очистка таймаута при размонтировании
    return () => clearTimeout(timeout);
  }, [isTelegramReady]);

  if (appState === 'uninitialized' || appState === 'loading') {
    return (
      <QueryClientProvider client={queryClient}>
        <Loader />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Debug App</title>
      </Head>
      
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive" 
        onLoad={() => console.log('Telegram script loaded')}
        onError={(e) => console.error('Telegram script error', e)}
      />

      <div style={{ padding: '20px' }}>
        <h1>Debug Information</h1>
        <p>isTelegramReady: {isTelegramReady.toString()}</p>
        <p>initData: {initData || 'none'}</p>
        <p>appState: {appState}</p>
        <p>error: {error}</p>
        
        <button onClick={() => {
          console.log('Manual reload');
          window.location.reload();
        }}>
          Reload App
        </button>
      </div>
    </QueryClientProvider>
  );
}

export default App;
