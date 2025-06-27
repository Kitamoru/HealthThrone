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
  const { 
    webApp, 
    initData, 
    startParam, 
    isTelegramReady,
    user: telegramUser 
  } = useTelegram();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<InitUserResponse | null>(null);

  useEffect(() => {
    if (!isTelegramReady || !initData) {
      if (!isTelegramReady && process.env.NODE_ENV === 'development') {
        console.log('DEV mode: Skipping Telegram initialization');
        setIsLoading(false);
      }
      return;
    }

    const initializeUser = async () => {
      try {
        const response = await api.initUser(initData, startParam);
        if (response.success && response.data) {
          const user = response.data as InitUserResponse;
          setUserData(user);
          queryClient.setQueryData(['userData', user.id], user);
          prefetchFriends(user.id, initData);
        }
      } catch (error) {
        console.error("Ошибка инициализации пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [isTelegramReady, initData, startParam]);

  useEffect(() => {
    if (!webApp || !initData) return;
    prefetchShopData(initData);
    const routes = ['/', '/shop', '/friends'];
    routes.forEach(route => Router.prefetch(route));
  }, [webApp, initData]);

  // Измененная функция - теперь без параметров
  const handleOnboardingComplete = () => {
    // Инвалидируем кеш, чтобы получить обновленные данные
    if (userData?.id) {
      queryClient.invalidateQueries({ queryKey: ['userData', userData.id] });
    }
    // Сбрасываем состояние онбординга
    setUserData(prev => prev ? {...prev, character_class: "temp"} : null);
  };

  const showOnboarding = isTelegramReady && 
                         userData && 
                         !userData.character_class;

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

      {isLoading ? (
        <Loader />
      ) : showOnboarding ? (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          userId={userData?.id}
          initData={initData}
        />
      ) : (
        <div className="page-transition">
          <Component {...pageProps} />
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;
