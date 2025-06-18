import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Prefetch shop data
const prefetchAllData = async (telegramId: number, initData?: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId, initData),
  });

  await queryClient.prefetchQuery({
    queryKey: ['friends', telegramId.toString()],
    queryFn: () => api.getFriends(telegramId.toString(), initData),
  });

  await queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });

  await queryClient.prefetchQuery({
    queryKey: ['ownedSprites', telegramId],
    queryFn: () => api.getOwnedSprites(telegramId, initData),
  });
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  {
    ssr: false,
    loading: () => <div>Загрузка...</div>
  }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, user } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    if (initData) {
      api.initUser(initData, startParam)
        .then(response => {
          if (response.success) {
            console.log('User initialized successfully');
          }
        })
        .finally(() => setUserInitialized(true));
    }
  }, [initData, startParam]);

  useEffect(() => {
    if (userInitialized && user?.id && initData) {
      const telegramId = Number(user.id);
      prefetchAllData(telegramId, initData);
      
      // Инвалидируем старые ключи для обратной совместимости
      queryClient.removeQueries({ queryKey: ['userData'] });
    }
  }, [userInitialized, user?.id, initData]);

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

      {userInitialized ? 
        <div className="page-transition">
          <Component {...pageProps} />
        </div> : 
        <Loader />
      }
    </QueryClientProvider>
  );
}

export default App;
