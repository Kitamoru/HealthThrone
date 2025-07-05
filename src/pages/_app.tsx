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
  return queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
};

const prefetchFriends = (userId: number, initData: string) => {
  return queryClient.prefetchQuery({
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
  return queryClient.prefetchQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: () => api.getOctalysisFactors(userId, initData),
    staleTime: 5 * 60 * 1000,
  });
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady } = useTelegram();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isTelegramReady || !initData) return;

    const initializeApp = async () => {
      try {
        const response = await api.initUser(initData, startParam);
        
        if (response.success && response.data) {
          const userId = response.data.id;
          
          await Promise.all([
            prefetchFriends(userId, initData),
            prefetchOctalysisFactors(userId, initData),
            prefetchShopData(initData),
            queryClient.prefetchQuery({
              queryKey: ['userData', userId],
              queryFn: () => api.getUserData(userId, initData)
            })
          ]);
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppReady(true);
      }
    };

    initializeApp();
  }, [initData, startParam, isTelegramReady]);

  useEffect(() => {
    if (isTelegramReady && initData) {
      Router.prefetch('/');
      Router.prefetch('/shop');
      Router.prefetch('/friends');
    }
  }, [isTelegramReady, initData]);

  if (!isTelegramReady || !appReady) {
    return <Loader />;
  }

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

      <div className="page-transition">
        <Component {...pageProps} />
      </div>
    </QueryClientProvider>
  );
}

export default App;
