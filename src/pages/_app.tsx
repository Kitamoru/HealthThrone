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

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, user } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [isDataPreloaded, setIsDataPreloaded] = useState(false);

  // Инициализация пользователя
  useEffect(() => {
    if (!initData) return;

    api.initUser(initData, startParam)
      .then(response => {
        if (response.success) {
          console.log('User initialized successfully');
        }
      })
      .finally(() => setUserInitialized(true));
  }, [initData, startParam]);

  // Предзагрузка всех данных и страниц после инициализации пользователя
  useEffect(() => {
    if (!userInitialized || !user?.id || !initData || !webApp) return;
    
    const preloadAllData = async () => {
      try {
        const telegramId = Number(user.id);
        
        // Параллельная предзагрузка всех данных
        await Promise.all([
          // Основные данные пользователя (для index)
          queryClient.prefetchQuery({
            queryKey: ['user', telegramId],
            queryFn: () => api.getUserData(telegramId, initData),
          }),
          
          // Данные друзей (для friends)
          queryClient.prefetchQuery({
            queryKey: ['friends', telegramId.toString()],
            queryFn: () => api.getFriends(telegramId.toString(), initData),
          }),
          
          // Спрайты магазина (для shop)
          queryClient.prefetchQuery({
            queryKey: ['sprites'],
            queryFn: () => api.getSprites(initData),
          }),
          
          // Купленные спрайты (для shop)
          queryClient.prefetchQuery({
            queryKey: ['ownedSprites', telegramId],
            queryFn: () => api.getOwnedSprites(telegramId, initData),
          })
        ]);
        
        // Предзагрузка страниц
        await Promise.all([
          Router.prefetch('/'),
          Router.prefetch('/shop'),
          Router.prefetch('/friends'),
        ]);
        
      } catch (error) {
        console.error('Prefetch error:', error);
      } finally {
        setIsDataPreloaded(true);
      }
    };

    preloadAllData();
  }, [userInitialized, user, initData, webApp]);

  // Показываем лоадер пока данные не готовы
  if (!userInitialized || !isDataPreloaded) {
    return (
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Загрузка...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <Loader />
      </QueryClientProvider>
    );
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
