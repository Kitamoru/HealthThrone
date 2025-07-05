import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Router from 'next/router';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import '@/styles/globals.css';

// Функция для префетча данных магазина
const prefetchShopData = (telegramId: number, initData?: string) => {
  queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
  
  // Добавляем префетч для спрайтов пользователя
  queryClient.prefetchQuery({
    queryKey: ['ownedSprites', telegramId],
    queryFn: () => api.getOwnedSprites(telegramId, initData),
  });
};

// Функция для префетча данных друзей
const prefetchFriends = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['friends', userId],
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

// Функция для префетча факторов Octalysis
const prefetchOctalysisFactors = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: () => api.getOctalysisFactors(userId, initData),
    staleTime: 5 * 60 * 1000,
  });
};

const Loader = dynamic(
  () => import('@/components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!initData) return;

    api.initUser(initData, startParam)
      .then(response => {
        if (response.success && response.data) {
          const userData = response.data;
          const userId = userData.id;
          const telegramId = userData.telegram_id;
          
          // Устанавливаем данные пользователя в кеш
          queryClient.setQueryData(['user', userId], userData);
          
          // Префетчим все зависимые данные ПОСЛЕ установки данных пользователя
          prefetchFriends(userId, initData);
          prefetchOctalysisFactors(userId, initData);
          prefetchShopData(telegramId, initData); // Добавлен префетч спрайтов
        } else if (response.error) {
          setInitError(response.error);
        }
        return response;
      })
      .catch(error => {
        console.error('User initialization failed:', error);
        setInitError('Failed to initialize user');
      })
      .finally(() => setUserInitialized(true));
  }, [initData, startParam]);

  useEffect(() => {
    // Префетч статических маршрутов (не зависит от данных пользователя)
    if (!webApp || !initData) return;
    
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

      {!userInitialized ? (
        <Loader />
      ) : initError ? (
        <div className="error-container">
          <h2>Ошибка инициализации</h2>
          <p>{initError}</p>
          <button onClick={() => window.location.reload()}>Попробовать снова</button>
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
