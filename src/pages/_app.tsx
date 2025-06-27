import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Router from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient'; // Используем созданный экземпляр
import '../styles/globals.css';
import Onboarding from '../components/Onboarding';

interface InitUserResponse {
  id: number;
  character_class: string | null;
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

  useEffect(() => {
    console.log('Telegram status:', {
      isReady: isTelegramReady,
      hasInitData: !!initData,
      userData
    });

    if (!isTelegramReady || !initData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV mode: Skipping Telegram initialization');
        setIsLoading(false);
      }
      return;
    }

    const initializeUser = async () => {
      console.log('Initializing user...');
      try {
        const response = await api.initUser(initData, startParam);
        console.log('User init response:', response);
        
        if (response.success && response.data) {
          const user = response.data as InitUserResponse;
          console.log('User data received:', user);
          
          setUserData(user);
          queryClient.setQueryData(['userData', user.id], user);
          prefetchFriends(user.id, initData);
          
          // Обновленная проверка: учитываем как null, так и пустую строку
          const needsOnboarding = user.character_class === null || 
                                 user.character_class === '';
          console.log('User needs onboarding:', needsOnboarding);
          
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
    
    // Принудительно обновляем данные пользователя
    if (userData?.id) {
      queryClient.invalidateQueries({ 
        queryKey: ['userData', userData.id] 
      });
      
      // Повторно запрашиваем данные пользователя
      api.getUserData(userData.id, initData)
        .then(response => {
          if (response.success && response.data) {
            setUserData(response.data);
          }
        });
    }
  };

  // Для разработки: принудительно показать онбординг
  const isDevMode = process.env.NODE_ENV === 'development';
  const forceOnboarding = isDevMode && true;

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
      ) : (showOnboarding || forceOnboarding) ? (
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
