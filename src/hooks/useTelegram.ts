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
  const [initData, setInitData] = useState('');
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [startParam, setStartParam] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initTelegram = () => {
      const telegram = window.Telegram;
      if (!telegram?.WebApp) {
        setError('Telegram WebApp not initialized');
        return;
      }

      const tg = telegram.WebApp;
      setWebApp(tg);
      setInitData(tg.initData);
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      if (tg.initDataUnsafe?.start_param) {
        setStartParam(tg.initDataUnsafe.start_param);
      }

      tg.ready();
      tg.expand();
      setIsReady(true);
    };

    // Инициализация при наличии объекта Telegram
    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      // Ожидаем кастомное событие от скрипта
      window.addEventListener('telegram-ready', initTelegram);
    }

    return () => {
      window.removeEventListener('telegram-ready', initTelegram);
    };
  }, []);

  return {
    user,
    isReady,
    initData,
    startParam,
    webApp,
    error
  };
};
