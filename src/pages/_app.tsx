import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Prefetch shop data
const prefetchShopData = (initData?: string) => {
  if (typeof window !== 'undefined') {
    queryClient.prefetchQuery({
      queryKey: ['sprites'],
      queryFn: () => api.getSprites(initData),
    });
  }
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  {
    ssr: false,
    loading: () => <div>Загрузка...</div>
  }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    if (initData) {
      api.initUser(initData, startParam)
        .then(response => {
          if (response.success) {
            console.log('User initialized successfully');
          }
        })
        .finally(() => setUserInitialized(true));
    }
  }, [initData, startParam]);

  useEffect(() => {
    if (webApp && initData) {
      // Prefetch shop data when app is ready
      prefetchShopData(initData);
    }
  }, [webApp, initData]);

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

      {userInitialized ? 
        <div className="page-transition">
          <Component {...pageProps} />
        </div> : 
        <Loader />
      }
    </QueryClientProvider>
  );
}

export default App;

useTelegram.ts
import { useEffect, useState } from 'react';

interface TelegramUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramContact {
  user_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    chat_instance?: string;
    chat_type?: string;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  showPopup: (params: any, callback?: (buttonId: string) => void) => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  showContactPicker?: (
    options: { title?: string },
    callback: (contact: TelegramContact) => void
  ) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [state, setState] = useState({
    webApp: null as TelegramWebApp | null,
    initData: '',
    user: null as TelegramUser | null,
    startParam: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initTelegram = () => {
      const telegram = window.Telegram;
      if (!telegram?.WebApp) return;

      const tg = telegram.WebApp;
      tg.ready();
      tg.expand();

      setState({
        webApp: tg,
        initData: tg.initData,
        user: tg.initDataUnsafe.user || null,
        startParam: tg.initDataUnsafe.start_param || '',
      });
    };

    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      const handleReady = () => {
        initTelegram();
        window.removeEventListener('telegram-ready', handleReady);
      };
      window.addEventListener('telegram-ready', handleReady);
    }

    return () => {
      window.removeEventListener('telegram-ready', initTelegram);
    };
  }, []);

  return state;
};
