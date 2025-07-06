import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number; // Изменено на number для совместимости с бекендом
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
    isReady: false,
    error: null as string | null, // Добавлено поле ошибки
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initTelegram = () => {
      try {
        const telegram = window.Telegram;
        if (!telegram?.WebApp) {
          throw new Error("Telegram WebApp SDK not loaded");
        }

        const tg = telegram.WebApp;
        
        // Проверяем готовность WebApp перед вызовами
        if (tg.initDataUnsafe) {
          tg.ready();
          tg.expand();
        } else {
          throw new Error("Telegram WebApp not initialized");
        }

        setState({
          webApp: tg,
          initData: tg.initData,
          user: tg.initDataUnsafe.user ? {
            ...tg.initDataUnsafe.user,
            id: parseInt(tg.initDataUnsafe.user.id) // Конвертируем ID в число
          } : null,
          startParam: tg.initDataUnsafe.start_param || '',
          isReady: true,
          error: null,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    const handleTelegramReady = () => {
      initTelegram();
      window.removeEventListener('telegram-ready', handleTelegramReady);
    };

    // Пытаемся инициализировать сразу
    initTelegram();

    // Если не готово, ждем событие
    if (!state.isReady && !state.error) {
      window.addEventListener('telegram-ready', handleTelegramReady);
    }

    // Таймаут для обработки случаев, когда SDK не загружается
    const timeoutId = setTimeout(() => {
      if (!state.isReady && !state.error) {
        setState(prev => ({
          ...prev,
          error: "Telegram SDK loading timed out",
        }));
      }
    }, 5000);

    return () => {
      window.removeEventListener('telegram-ready', handleTelegramReady);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    ...state,
    isTelegramReady: state.isReady,
    error: state.error,
  };
};
