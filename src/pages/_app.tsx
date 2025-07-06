import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import Router from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Валидация initData для базовой безопасности
const validateInitData = (initData: string) => {
  return /user=.+&hash=.+/.test(initData);
};

const prefetchShopData = (initData: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
    retry: 2,
    retryDelay: 1000,
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
          friend_username: formatUserName(f.friend),
          burnout_level: f.friend.burnout_level
        }));
      }
      throw new Error(response.error || 'Failed to load friends');
    },
    retry: 2,
    retryDelay: 1000,
  });
};

const prefetchOctalysisFactors = (userId: number, initData: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: () => api.getOctalysisFactors(userId, initData),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

// Минимально поддерживаемая версия Telegram Web App
const MIN_WEBAPP_VERSION = '6.0';

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady, themeParams } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Применяем тему Telegram динамически
  useEffect(() => {
    if (!themeParams || typeof document === 'undefined') return;
    
    const root = document.documentElement;
    if (themeParams.bg_color) root.style.setProperty('--tg-bg-color', themeParams.bg_color);
    if (themeParams.text_color) root.style.setProperty('--tg-text-color', themeParams.text_color);
    if (themeParams.button_color) root.style.setProperty('--tg-button-color', themeParams.button_color);
    if (themeParams.button_text_color) root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
  }, [themeParams]);

  // Основная инициализация приложения
  useEffect(() => {
    if (!isTelegramReady) return;
    
    // Проверка версии WebApp
    if (webApp?.version && webApp.version < MIN_WEBAPP_VERSION) {
      setError(`Требуется обновить Telegram. Минимальная версия: ${MIN_WEBAPP_VERSION}`);
      return;
    }

    // Безопасность: валидация initData
    if (!initData || !validateInitData(initData)) {
      setError("Неверные данные инициализации. Пожалуйста, откройте приложение через Telegram");
      return;
    }

    const initializeApp = async () => {
      try {
        // Инициализация пользователя
        const userResponse = await api.initUser(initData, startParam);
        if (!userResponse.success || !userResponse.data) {
          throw new Error(userResponse.error || "Ошибка инициализации пользователя");
        }

        const userData = userResponse.data;
        const userId = userData.id;
        queryClient.setQueryData(['userData', userId], userData);

        // Последовательная предзагрузка данных
        await prefetchShopData(initData);
        await prefetchFriends(userId, initData);
        await prefetchOctalysisFactors(userId, initData);

        // Префетч основных роутов
        Router.prefetch('/');
        Router.prefetch('/shop');
        Router.prefetch('/friends');

        setUserInitialized(true);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
        
        // Тактильная обратная связь при ошибке
        webApp?.HapticFeedback?.notificationOccurred?.('error');
      }
    };

    initializeApp();
  }, [initData, startParam, isTelegramReady, webApp]);

  // Показываем ошибку если приложение открыто вне Telegram
  if (!isTelegramReady && typeof window !== 'undefined') {
    return (
      <div className="error-container">
        <h2>Требуется Telegram</h2>
        <p>Пожалуйста, откройте приложение через Telegram</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Burnout Tracker - Отслеживание выгорания</title>
        <meta name="description" content="Telegram Mini App для отслеживания уровня выгорания" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content={themeParams?.bg_color || "#18222d"} />
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
          <p>Пожалуйста, перезапустите приложение</p>
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
