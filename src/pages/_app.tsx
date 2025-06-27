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
import Onboarding from '../components/Onboarding';

// Обновленный тип для ответа initUser
interface InitUserResponse {
  id: number;
  character_class: string | null;
  // Другие поля пользователя
}

// Prefetch shop data
const prefetchShopData = (initData?: string) => {
  queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
};

// Prefetch friends data
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

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState<InitUserResponse | null>(null);

  useEffect(() => {
    if (!initData) return;

    // Инициализируем пользователя
    api.initUser(initData, startParam)
      .then(response => {
        if (response.success && response.data) {
          const userData = response.data as InitUserResponse;
          setUserData(userData);
          
          // Проверяем, прошел ли пользователь онбординг
          if (!userData.character_class) {
            setShowOnboarding(true);
          }
          
          const userId = userData.id;
          
          // Предзагружаем данные друзей
          prefetchFriends(userId, initData);
          
          // Сохраняем данные пользователя
          queryClient.setQueryData(['userData', userId], userData);
        }
        return response;
      })
      .finally(() => setUserInitialized(true));
  }, [initData, startParam]);

  useEffect(() => {
    if (!webApp || !initData) return;
    
    // Предзагружаем данные магазина
    prefetchShopData(initData);
    
    // Предзагружаем страницы
    const routes = ['/', '/shop', '/friends'];
    routes.forEach(route => Router.prefetch(route));
  }, [webApp, initData]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Обновляем данные пользователя после онбординга
    if (userData?.id) {
      queryClient.invalidateQueries({ queryKey: ['userData', userData.id] })
    }
  };

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
) : showOnboarding ? (
  <Onboarding ... />
) : (
  <Component ... />
)}
    </QueryClientProvider>
  );
}

export default App;
