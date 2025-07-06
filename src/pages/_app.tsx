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

// Оптимизация: мемоизация функций префетчинга
const prefetchShopData = useCallback((initData?: string) => {
  if (!queryClient.getQueryData(['sprites'])) {
    queryClient.prefetchQuery({
      queryKey: ['sprites'],
      queryFn: () => api.getSprites(initData),
      staleTime: 10 * 60 * 1000,
    });
  }
}, []);

const prefetchFriends = useCallback((userId: number, initData: string) => {
  const queryKey = ['friends', userId.toString()];
  if (!queryClient.getQueryData(queryKey)) {
    queryClient.prefetchQuery({
      queryKey,
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
      staleTime: 5 * 60 * 1000,
    });
  }
}, []);

const prefetchOctalysisFactors = useCallback((userId: number, initData: string) => {
  const queryKey = ['octalysisFactors', userId];
  if (!queryClient.getQueryData(queryKey)) {
    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => api.getOctalysisFactors(userId, initData),
      staleTime: 5 * 60 * 1000,
    });
  }
}, []);

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  { 
    ssr: false, 
    loading: () => <div className="flex justify-center items-center h-screen">Загрузка...</div>
  }
);

// Проверка готовности критических данных для текущей страницы
const useCriticalDataReady = (pathname: string, userId?: number) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkData = () => {
      // Критические данные для разных страниц
      const criticalQueries: Record<string, string[]> = {
        '/': ['userData', userId.toString(), 'octalysisFactors', userId.toString()],
        '/friends': ['userData', userId.toString(), 'friends', userId.toString()],
        '/shop': ['userData', userId.toString(), 'sprites'],
      };

      const queries = criticalQueries[pathname] || criticalQueries['/'];
      const queryKey = queries.slice(0, 2) as [string, string?];
      
      // Проверяем наличие данных в кеше
      const hasData = !!queryClient.getQueryData(queryKey);
      setIsReady(hasData);
    };

    // Первоначальная проверка
    checkData();

    // Подписка на изменения кеша
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      checkData();
    });

    return () => unsubscribe();
  }, [pathname, userId]);

  return isReady;
};

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady, error: telegramError } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentPath, setCurrentPath] = useState(Router.pathname);
  const userId = queryClient.getQueryData<{ id: number }>(['userData'])?.id;
  
  const criticalDataReady = useCriticalDataReady(currentPath, userId);

  // Отслеживаем изменения пути
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      setCurrentPath(url);
    };

    Router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      Router.events.off('routeChangeStart', handleRouteChange);
    };
  }, []);

  // Инициализация пользователя
  useEffect(() => {
    if (!isTelegramReady) return;
    
    if (telegramError) {
      setError(telegramError);
      return;
    }

    if (!initData) {
      setError("Приложение должно быть запущено внутри Telegram");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const initializeUser = async () => {
      try {
        const response = await api.initUser(initData, startParam, { signal });
        
        if (response.success && response.data) {
          const userData = response.data;
          const userId = userData.id;
          
          queryClient.setQueryData(['userData', userId], userData);
          
          // Запускаем префетчи без блокировки интерфейса
          setImmediate(() => {
            prefetchFriends(userId, initData);
            prefetchOctalysisFactors(userId, initData);
            prefetchShopData(initData);
          });
          
          // Предзагрузка маршрутов
          Router.prefetch('/');
          Router.prefetch('/shop');
          Router.prefetch('/friends');
        } else {
          setError(response.error || "Ошибка инициализации пользователя");
          
          // Автоматический ретрай при сетевых ошибках
          if (response.status >= 500 && !isRetrying) {
            setIsRetrying(true);
            setTimeout(initializeUser, 2000);
            return;
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Initialization error:", err);
          setError("Критическая ошибка инициализации");
        }
      } finally {
        setUserInitialized(true);
        setIsRetrying(false);
      }
    };

    initializeUser();

    return () => controller.abort();
  }, [initData, startParam, isTelegramReady, telegramError, isRetrying]);

  // Комбинированное состояние готовности
  const isAppReady = userInitialized && 
                   (!userId || criticalDataReady || currentPath === '/loading');

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Burnout Tracker - Отслеживание выгорания</title>
        <meta name="description" content="Telegram Mini App для отслеживания уровня выгорания" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18222d" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>

      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive"
        onError={() => setError("Не удалось загрузить Telegram SDK")}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-xl font-bold mb-2">Ошибка запуска</h2>
          <p className="mb-4">{error}</p>
          {error.includes("Telegram") && (
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => window.location.reload()}
            >
              Перезагрузить
            </button>
          )}
        </div>
      ) : isAppReady ? (
        <Component {...pageProps} />
      ) : (
        <Loader />
      )}
    </QueryClientProvider>
  );
}

export default App;
