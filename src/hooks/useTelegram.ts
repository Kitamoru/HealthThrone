import { useEffect, useState } from 'react';

// Оптимизация: вынесены интерфейсы в отдельный файл
import type { 
  TelegramWebApp, 
  TelegramUser, 
  TelegramContact 
} from '../types/telegram';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Добавлен таймаут и обработка ошибок
const TELEGRAM_LOAD_TIMEOUT = 3000;

export const useTelegram = () => {
  const [state, setState] = useState({
    webApp: null as TelegramWebApp | null,
    initData: '',
    user: null as TelegramUser | null,
    startParam: '',
    isReady: false,
    error: null as string | null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const initTelegram = () => {
      const telegram = window.Telegram;
      if (!telegram?.WebApp) {
        // Таймаут для случаев, когда скрипт не загрузился
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setState(prev => ({
              ...prev,
              error: "Не удалось загрузить Telegram WebApp. Проверьте интернет-соединение."
            }));
          }
        }, TELEGRAM_LOAD_TIMEOUT);
        return;
      }

      const tg = telegram.WebApp;
      
      try {
        tg.ready();
        tg.expand();

        if (isMounted) {
          setState({
            webApp: tg,
            initData: tg.initData,
            user: tg.initDataUnsafe.user || null,
            startParam: tg.initDataUnsafe.start_param || '',
            isReady: true,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            error: `Ошибка инициализации Telegram: ${(err as Error).message}`
          }));
        }
      }
    };

    const handleReady = () => {
      clearTimeout(timeoutId);
      initTelegram();
    };

    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      window.addEventListener('telegram-ready', handleReady);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener('telegram-ready', handleReady);
    };
  }, []);

  return {
    ...state,
    isTelegramReady: state.isReady,
  };
};
