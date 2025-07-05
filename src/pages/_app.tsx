import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Router from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Упрощенные функции префетча
const prefetchShopData = (initData?: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
};

const prefetchFriends = (userId: number, initData: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['friends', userId.toString()],
    queryFn: () => api.getFriends(userId.toString(), initData),
  });
};

const prefetchOctalysisFactors = (userId: number, initData: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: () => api.getOctalysisFactors(userId, initData),
  });
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady } = useTelegram();
  const [appState, setAppState] = useState<
    'uninitialized' | 'loading' | 'authenticated' | 'error'
  >('uninitialized');
  const [error, setError] = useState<string | null>(null);

  console.log("App rendering, state:", appState);
  
  useEffect(() => {
    console.log("Telegram ready:", isTelegramReady);
    if (!isTelegramReady) return;
    if (appState !== 'uninitialized') return;

    console.log("InitData exists:", !!initData);
    if (!initData) {
      console.error("No initData - outside Telegram");
      setError("Приложение должно быть запущено внутри Telegram");
      setAppState('error');
      return;
    }

    console.log("Starting user initialization");
    setAppState('loading');
    
    api.initUser(initData, startParam)
      .then(response => {
        if (response.success && response.data) {
          console.log("User initialized:", response.data.id);
          const userData = response.data;
          const userId = userData.id;
          
          queryClient.setQueryData(['userData', userId], userData);
          
          // Параллельный префетч с обработкой ошибок
          Promise.allSettled([
            prefetchFriends(userId, initData),
            prefetchOctalysisFactors(userId, initData),
            prefetchShopData(initData)
          ])
            .then(results => {
              results.forEach((result, index) => {
                if (result.status === 'rejected') {
                  console.error(`Prefetch ${index} failed:`, result.reason);
                }
              });
              console.log("All prefetches completed");
              setAppState('authenticated');
            });
        } else {
          console.error("User init failed:", response.error);
          setError(response.error || "Ошибка инициализации пользователя");
          setAppState('error');
        }
      })
      .catch(error => {
        console.error("User initialization failed:", error);
        setError("Сетевая ошибка при инициализации");
        setAppState('error');
      });
  }, [initData, startParam, isTelegramReady, appState]);

  useEffect(() => {
    if (appState === 'authenticated' && initData) {
      console.log("Prefetching routes");
      Router.prefetch('/');
      Router.prefetch('/shop');
      Router.prefetch('/friends');
    }
  }, [initData, appState]);

  if (appState === 'loading' || appState === 'uninitialized') {
    console.log("Rendering loader");
    return (
      <QueryClientProvider client={queryClient}>
        <Loader />
      </QueryClientProvider>
    );
  }

  console.log("Rendering main layout, state:", appState);
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Burnout Tracker - Отслеживание выгорания</title>
        <meta name="description" content="Telegram Mini App для отслеживания уровня выгорания" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18222d" />
      </Head>

      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive" 
        onLoad={() => {
          console.log("Telegram script loaded");
          if (window.Telegram?.WebApp) {
            window.dispatchEvent(new Event('telegram-ready'));
          }
        }}
      />

      {appState === 'error' ? (
        <div className="error-container">
          <h2>Ошибка запуска</h2>
          <p>{error}</p>
          <p>Пожалуйста, откройте приложение через Telegram</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      ) : (
        <div className="page-transition">
          <Component {...pageProps} />
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;
