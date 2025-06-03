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
    start_param?: string;  // <-- Важное поле для реферальных ссылок
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
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState('');
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [startParam, setStartParam] = useState(''); // <-- Добавлено новое состояние

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
        
        // Check initData
        if (!tg.initData) {
          const errorMsg = 'initData is empty';
          setError(errorMsg);
          console.error('[useTelegram]', errorMsg);
        } else {
          setInitData(tg.initData);
          console.log('[useTelegram] initData set');
        }

        // Check user data
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
          console.log('[useTelegram] User data set:', tg.initDataUnsafe.user);
        } else {
          const errorMsg = 'User data not available in initDataUnsafe';
          setError(errorMsg);
          console.error('[useTelegram]', errorMsg);
        }

        // Добавлено: Извлечение start_param
        if (tg.initDataUnsafe?.start_param) {
          setStartParam(tg.initDataUnsafe.start_param);
          console.log('[useTelegram] start_param set:', tg.initDataUnsafe.start_param);
        }

        // Initialize Telegram WebApp
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

    // Add delay for async loading
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
    startParam, // <-- Возвращаем startParam
    webApp,
    error
  };
};
