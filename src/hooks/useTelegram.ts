import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
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
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState('');
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initTelegram = () => {
      try {
        const telegram = window.Telegram;
        
        if (!telegram) {
          setError('Telegram object not found on window');
          console.error('Telegram object is undefined');
          return;
        }

        if (!telegram.WebApp) {
          setError('Telegram.WebApp not initialized');
          console.error('Telegram.WebApp is undefined');
          return;
        }

        const tg = telegram.WebApp;
        setWebApp(tg);
        
        // Проверяем наличие initData
        if (!tg.initData) {
          setError('initData is empty');
          console.error('Telegram WebApp initData is empty');
        } else {
          setInitData(tg.initData);
        }

        // Проверяем наличие пользователя
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
        } else {
          setError('User data not available in initDataUnsafe');
          console.error('Telegram user data is missing');
        }

        // Инициализируем Telegram WebApp
        tg.ready();
        tg.expand();
        setIsReady(true);

        console.log('Telegram WebApp initialized successfully', {
          user: tg.initDataUnsafe.user,
          initData: tg.initData,
        });

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to initialize Telegram WebApp: ${message}`);
        console.error('Telegram init error:', err);
      }
    };

    // Добавляем задержку для случаев, когда объект загружается асинхронно
    const timer = setTimeout(initTelegram, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isReady,
    initData,
    webApp,
    error
  };
};
