import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { Press_Start_2P } from 'next/font/google'; // добавлен импорт шрифта
import { useEffect, useState } from 'react';
import Router from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Настройка пиксельного шрифта для ретро-стиля
const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin', 'cyrillic'], // поддержка кириллицы
  variable: '--font-press-start', // CSS-переменная для использования в стилях
});

const prefetchShopData = (initData?: string) => {
  queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
};

// Сохраняем преобразование данных для друзей из второго варианта
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

// Добавлена функция префетчинга купленных спрайтов
const prefetchOwnedSprites = (userId: number, initData: string) => {
  queryClient.prefetchQuery({
    queryKey: ['ownedSprites', userId],
    queryFn: () => api.getOwnedSprites(userId, initData),
    staleTime: 5 * 60 * 1000, // 5 минут кеширования
  });
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false, loading: () => <div>Загрузка...</div> }
);

function App({ Component, pageProps }: AppProps) {
  // Сохраняем получение user из useTelegram (первый вариант)
  const { initData, startParam, webApp, isTelegramReady, user } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Сохраняем проверку user из первого варианта
  useEffect(() => {
    if (!isTelegramReady || !initData || !user) return;
    
    api.initUser(initData, startParam)
      .then(response => {
        if (response.success && response.data) {
          const userData = response.data;
          const userId = userData.id;
          
          prefetchFriends(userId, initData);
          prefetchOctalysisFactors(userId, initData);
          prefetchOwnedSprites(userId, initData); // Добавлен префетч купленных спрайтов
          
          queryClient.setQueryData(['userData', userId], userData);
        } else {
          setError(response.error || "Ошибка инициализации пользователя");
        }
      })
      .catch(error => {
        console.error("User initialization failed:", error);
        setError("Сетевая ошибка при инициализации");
      })
      .finally(() => setUserInitialized(true));
  }, [initData, startParam, isTelegramReady, user]);

  useEffect(() => {
    if (!isTelegramReady || !initData) return;
    
    prefetchShopData(initData);
    
    const routes = ['/', '/shop', '/friends'];
    routes.forEach(route => Router.prefetch(route));
  }, [initData, isTelegramReady]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Добавляем класс с переменной шрифта для всего приложения */}
      <div className={pressStart2P.variable}>
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

        {error ? (
          <div className="error-container">
            <h2>Ошибка запуска</h2>
            <p>{error}</p>
            <p>Пожалуйста, откройте приложение через Telegram</p>
          </div>
        ) : userInitialized ? (
          <div className="page-transition">
            <Component {...pageProps} />
          </div>
        ) : (
          <Loader />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
