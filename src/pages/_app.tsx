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
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Флаг для принудительного показа онбординга
  const [forceOnboarding, setForceOnboarding] = useState(false);

  useEffect(() => {
    // Проверка параметра URL для принудительного онбординга
    const urlParams = new URLSearchParams(window.location.search);
    const forceOnboardParam = urlParams.get('force_onboard');
    
    if (forceOnboardParam === 'true') {
      console.log('Forcing onboarding via URL parameter');
      setForceOnboarding(true);
      setShowOnboarding(true);
      setIsLoading(false);
      return;
    }

    if (!isTelegramReady || !initData) {
      if (process.env.NODE_ENV === 'development') {
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
          
          const needsOnboarding = user.character_class === null || 
                                 user.character_class === '';
          
          if (needsOnboarding) {
            setShowOnboarding(true);
          }
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

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed');
    setShowOnboarding(false);
    setForceOnboarding(false);
    
    if (userData?.id) {
      queryClient.invalidateQueries({ 
        queryKey: ['userData', userData.id] 
      });
    }
  };

  // Для разработки: кнопка принудительного запуска онбординга
  const isDevMode = process.env.NODE_ENV === 'development';

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
            console.log('Telegram WebApp script loaded');
            window.dispatchEvent(new Event('telegram-ready'));
          }
        }}
      />

      {isLoading ? (
        <Loader />
      ) : showOnboarding || forceOnboarding ? (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          userId={userData?.id}
          initData={initData}
        />
      ) : (
        <div className="page-transition">
          <Component {...pageProps} />
          
          {/* Кнопка для принудительного запуска онбординга в dev-режиме */}
          {isDevMode && (
            <div className="fixed bottom-4 right-4 z-50">
              <button
                onClick={() => {
                  setForceOnboarding(true);
                  setShowOnboarding(true);
                }}
                className="p-3 bg-red-500 text-white rounded-lg shadow-lg"
              >
                DEV: Force Onboarding
              </button>
            </div>
          )}
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;
