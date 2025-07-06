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

const prefetchShopData = (initData?: string) => {
  queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  }).catch(error => console.error("Prefetch sprites failed:", error));
};

const prefetchFriends = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['friends', userId],
    queryFn: () => api.getFriends(userId, initData),
  }).catch(error => console.error("Prefetch friends failed:", error));
};

const prefetchOctalysisFactors = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: () => api.getOctalysisFactors(userId, initData),
    staleTime: 5 * 60 * 1000,
  }).catch(error => console.error("Prefetch octalysis factors failed:", error));
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTelegramReady) return;
    
    if (!initData) {
      setError("Приложение должно быть запущено внутри Telegram");
      return;
    }

    api.initUser(initData, startParam)
      .then(response => {
        if (response.success && response.data) {
          const userData = response.data;
          const userId = userData.id;
          
          queryClient.setQueryData(['user', userId], userData);
          prefetchFriends(userId, initData);
          prefetchOctalysisFactors(userId, initData);
        } else {
          setError(response.error || "Ошибка инициализации пользователя");
        }
      })
      .catch(error => {
        console.error("User initialization failed:", error);
        setError("Сетевая ошибка при инициализации");
      })
      .finally(() => setUserInitialized(true));
  }, [initData, startParam, isTelegramReady]);

  useEffect(() => {
    if (!isTelegramReady || !initData) return;
    
    prefetchShopData(initData);
    
    const routes = ['/', '/shop', '/friends'];
    routes.forEach(route => Router.prefetch(route));
  }, [initData, isTelegramReady]);

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
          if (window.Telegram?.WebApp) {
            window.dispatchEvent(new Event('telegram-ready'));
          }
        }}
      />

      {error ? (
        <div className="error-container">
          <h2>Ошибка запуска</h2>
          <p>{error}</p>
          <p>Пожалуйста, откройте приложение через Telegram</p>
        </div>
      ) : userInitialized ? (
        <div className="page-transition">
          <Component {...pageProps} />
        </div>
      ) : (
        <Loader />
      )}
    </QueryClientProvider>
  );
}

export default App;
