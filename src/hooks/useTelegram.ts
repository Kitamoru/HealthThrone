
import { useEffect, useState } from 'react';
import type { TelegramWebApp, TelegramUser } from '@/types/telegram';

interface UseTelegramReturn {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  initData: string;
}

export const useTelegram = (): UseTelegramReturn => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp;
      setWebApp(app);
      setUser(app.initDataUnsafe.user || null);
      setInitData(app.initData);
      
      app.ready();
      app.expand();
      
      // Apply Telegram theme
      document.documentElement.style.setProperty('--tg-bg', app.backgroundColor);
      document.documentElement.style.setProperty('--tg-text', app.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-secondary', app.themeParams.secondary_bg_color || '#2a3a4d');
      document.documentElement.style.setProperty('--tg-accent', app.themeParams.link_color || '#5b8cff');
      document.documentElement.style.setProperty('--tg-border', app.themeParams.hint_color || 'rgba(255,255,255,0.1)');
      
      setIsReady(true);
    } else {
      // Development mode without Telegram
      setIsReady(true);
    }
  }, []);

  return { webApp, user, isReady, initData };
};
