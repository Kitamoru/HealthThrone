import { useEffect, useState } from 'react';

// Упростим интерфейсы для читаемости
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: string;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
}

export const useTelegram = () => {
  const [state, setState] = useState({
    webApp: null as TelegramWebApp | null,
    initData: '',
    user: null as { id: string; [key: string]: any } | null,
    startParam: '',
    isReady: false,
  });

  useEffect(() => {
    // Важно: код только для клиентской стороны
    if (typeof window === 'undefined') return;
    
    const initTelegram = () => {
      const telegram = window.Telegram;
      if (!telegram?.WebApp) {
        console.error('Telegram.WebApp not found');
        return;
      }

      const tg = telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.error('Error in Telegram WebApp methods:', e);
      }

      setState({
        webApp: tg,
        initData: tg.initData,
        user: tg.initDataUnsafe.user || null,
        startParam: tg.initDataUnsafe.start_param || '',
        isReady: true,
      });
    };

    // Обработчик для кастомного события
    const handleReady = () => {
      initTelegram();
      window.removeEventListener('telegram-ready', handleReady);
    };

    // Если объект уже доступен
    if (window.Telegram?.WebApp) {
      initTelegram();
    } 
    // Если еще не загружен, ждем события
    else {
      window.addEventListener('telegram-ready', handleReady);
    }

    // Fallback: проверяем каждые 100мс в течение 2 секунд
    const intervalId = setInterval(() => {
      if (window.Telegram?.WebApp) {
        initTelegram();
        clearInterval(intervalId);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (!state.isReady) {
        console.warn('Telegram initialization timed out');
        setState(prev => ({ ...prev, isReady: true }));
      }
    }, 2000);

    return () => {
      window.removeEventListener('telegram-ready', handleReady);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    ...state,
    isTelegramReady: state.isReady,
  };
};
