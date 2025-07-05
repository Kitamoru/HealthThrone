import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import Router from 'next/router';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { ssr: false }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, isTelegramReady } = useTelegram();
  const [appState, setAppState] = useState<'init' | 'loading' | 'ready' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false); // Флаг однократной инициализации

  // Эффект для инициализации пользователя
  useEffect(() => {
    // Выполняем только на клиенте
    if (typeof window === 'undefined') return;
    
    // Проверяем готовность Telegram и отсутствие предыдущей инициализации
    if (!isTelegramReady || initializedRef.current) return;
    
    // Отмечаем начало инициализации
    initializedRef.current = true;
    setAppState('loading');
    
    // Проверка обязательных данных
    if (!initData) {
      setError("Приложение должно быть запущено внутри Telegram");
      setAppState('error');
      return;
    }

    // Инициализация пользователя
    api.initUser(initData, startParam)
      .then(response => {
        if (response.success && response.data) {
          const userData = response.data;
          const userId = userData.id;
          
          // Устанавливаем данные пользователя в кеш
          queryClient.setQueryData(['userData', userId], userData);
          
          // Устанавливаем состояние приложения
          setAppState('ready');
        } else {
          setError(response.error || "Ошибка инициализации пользователя");
          setAppState('error');
        }
      })
      .catch(error => {
        console.error("User initialization failed:", error);
        setError("Сетевая ошибка при инициализации");
        setAppState('error');
      });
  }, [initData, startParam, isTelegramReady]);

  // Эффект для предзагрузки данных и роутов
  useEffect(() => {
    if (appState !== 'ready' || !initData) return;
    
    // Предзагрузка статических данных
    api.getSprites(initData)
      .then(response => {
        if (response.success) {
          queryClient.setQueryData(['sprites'], response.data);
        }
      })
      .catch(console.error);
    
    // Предзагрузка роутов
    Router.prefetch('/');
    Router.prefetch('/shop');
    Router.prefetch('/friends');
  }, [appState, initData]);

  // Рендер лоадера во время загрузки
  if (appState === 'init' || appState === 'loading') {
    return (
      <QueryClientProvider client={queryClient}>
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
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Telegram?.WebApp) {
            window.dispatchEvent(new Event('telegram-ready'));
          }
        }}
        onError={(e) => console.error('Telegram script failed', e)}
      />

      {appState === 'error' ? (
        <div className="error-container">
          <h2>Ошибка запуска</h2>
          <p>{error}</p>
          <p>Пожалуйста, откройте приложение через Telegram</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
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
