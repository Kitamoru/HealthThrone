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

// Basic initData validation
const validateInitData = (initData: string) => {
  return /user=.+&hash=.+/.test(initData);
};

// Format username display
const formatUserName = (user: { first_name: string; last_name?: string; username?: string }) => {
  return user.username || `${user.first_name} ${user.last_name || ''}`.trim();
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

// Minimum supported Telegram Web App version
const MIN_WEBAPP_VERSION = '6.0';

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp, isTelegramReady, themeParams } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply Telegram theme dynamically
  useEffect(() => {
    if (!themeParams || typeof document === 'undefined') return;
    
    const root = document.documentElement;
    if (themeParams.bg_color) root.style.setProperty('--tg-bg-color', themeParams.bg_color);
    if (themeParams.text_color) root.style.setProperty('--tg-text-color', themeParams.text_color);
    if (themeParams.button_color) root.style.setProperty('--tg-button-color', themeParams.button_color);
    if (themeParams.button_text_color) root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
  }, [themeParams]);

  // Main app initialization
  useEffect(() => {
    if (!isTelegramReady) return;
    
    // WebApp version check
    if (webApp?.version && webApp.version < MIN_WEBAPP_VERSION) {
      setError(`Please update Telegram. Minimum version: ${MIN_WEBAPP_VERSION}`);
      return;
    }

    // Security: initData validation
    if (!initData || !validateInitData(initData)) {
      setError("Invalid initialization data. Please open the app through Telegram");
      return;
    }

    const initializeApp = async () => {
      try {
        // User initialization
        const userResponse = await api.initUser(initData, startParam);
        if (!userResponse.success || !userResponse.data) {
          throw new Error(userResponse.error || "User initialization error");
        }

        const userData = userResponse.data;
        const userId = userData.id;
        queryClient.setQueryData(['userData', userId], userData);

        // PARALLEL DATA PREFETCHING
        await Promise.all([
          prefetchShopData(initData),
          prefetchFriends(userId, initData),
          prefetchOctalysisFactors(userId, initData)
        ]);

        // Prefetch main routes
        Router.prefetch('/');
        Router.prefetch('/shop');
        Router.prefetch('/friends');

        setUserInitialized(true);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        // Haptic feedback on error
        try {
          webApp?.HapticFeedback?.notificationOccurred?.('error');
        } catch (hapticError) {
          console.warn('Haptic feedback failed', hapticError);
        }
      }
    };

    initializeApp();
  }, [initData, startParam, isTelegramReady, webApp]);

  // Show error if app opened outside Telegram
  if (!isTelegramReady && typeof window !== 'undefined') {
    return (
      <div className="error-container">
        <h2>Telegram Required</h2>
        <p>Please open the app through Telegram</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Burnout Tracker - Burnout Monitoring</title>
        <meta name="description" content="Telegram Mini App for burnout level tracking" />
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
          <h2>Launch Error</h2>
          <p>{error}</p>
          <p>Please restart the application</p>
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
