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

    console.log('[useTelegram] Initializing Telegram WebApp hook');
    
    const initTelegram = () => {
      try {
        console.log('[useTelegram] Checking for Telegram object');
        const telegram = window.Telegram;
        
        if (!telegram) {
          const errorMsg = 'Telegram object not found on window';
          setError(errorMsg);
          console.error('[useTelegram]', errorMsg);
          return;
        }

        if (!telegram.WebApp) {
          const errorMsg = 'Telegram.WebApp not initialized';
          setError(errorMsg);
          console.error('[useTelegram]', errorMsg);
          return;
        }

        const tg = telegram.WebApp;
        console.log('[useTelegram] Telegram WebApp found:', tg);
        
        setWebApp(tg);
        
        // Проверяем наличие initData
        if (!tg.initData) {
          const errorMsg = 'initData is empty';
          setError(errorMsg);
          console.error('[useTelegram]', errorMsg);
        } else {
          setInitData(tg.initData);
          console.log('[useTelegram] initData set');
        }

        // Проверяем наличие пользователя
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
          console.log('[useTelegram] User data set:', tg.initDataUnsafe.user);
        } else {
          const errorMsg = 'User data not available in initDataUnsafe';
          setError(errorMsg);
          console.error('[useTelegram]', errorMsg);
        }

        // Инициализируем Telegram WebApp
        console.log('[useTelegram] Calling Telegram.ready() and expand()');
        tg.ready();
        tg.expand();
        setIsReady(true);
        console.log('[useTelegram] Telegram WebApp initialized successfully');

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const errorMsg = `Failed to initialize Telegram WebApp: ${message}`;
        setError(errorMsg);
        console.error('[useTelegram]', errorMsg, err);
      }
    };

    // Добавляем задержку для случаев, когда объект загружается асинхронно
    const timer = setTimeout(initTelegram, 1000);
    
    return () => {
      console.log('[useTelegram] Cleaning up hook');
      clearTimeout(timer);
    };
  }, []);

  return {
    user,
    isReady,
    initData,
    webApp,
    error
  };
};
