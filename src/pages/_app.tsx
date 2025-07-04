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

interface InitUserResponse {
  id: number;
}

const prefetchShopData = (initData?: string) => {
  queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
};

const prefetchFriends = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['friends', userId.toString()],
    queryFn: async () => {
      const response = await api.getFriends(userId.toString(), initData);
      if (response.success && response.data) {
        return response.data.map(f => ({
          id: f.id,
          friend_id: f.friend.id,
          friend_username: f.friend.username || 
                          `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
          burnout_level: f.friend.burnout_level
        }));
      }
      throw new Error(response.error || 'Failed to load friends');
    },
  });
};

const prefetchOctalysisFactors = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: () => api.getOctalysisFactors(userId, initData),
    staleTime: 5 * 60 * 1000, // 5 минут кеширования
  });
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [minLoadingShown, setMinLoadingShown] = useState(false);

  // Минимальное время показа лоадера (700 мс)
  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingShown(true), 700);
    return () => clearTimeout(timer);
  }, []);

  // Инициализация пользователя (с учетом готовности Telegram WebApp)
  useEffect(() => {
    if (!isTelegramReady || !initData) return;

    api.initUser(initData, startParam)
      .then(response => {
        // Исправлено: response.user вместо response.data
        if (response.success && response.user) {
          const userData = response.user;
          const userId = userData.id;
          
          prefetchFriends(userId, initData);
          prefetchOctalysisFactors(userId, initData);
          
          queryClient.setQueryData(['userData', userId], userData);
        }
        return response;
      })
      .finally(() => setUserInitialized(true));
  }, [initData, startParam, isTelegramReady]);

  // Префетч данных магазина
  useEffect(() => {
    if (!webApp || !initData) return;
    
    prefetchShopData(initData);
    
    const routes = ['/', '/shop', '/friends'];
    routes.forEach(route => Router.prefetch(route));
  }, [webApp, initData]);

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

      {userInitialized && minLoadingShown ? (
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
