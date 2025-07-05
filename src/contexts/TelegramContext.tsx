import { createContext, useContext, useEffect, useState } from 'react';

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

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  initData: string;
  user: TelegramUser | null;
  startParam: string;
  isReady: boolean;
  updateUser: (user: TelegramUser) => void;
}

const defaultState: TelegramContextType = {
  webApp: null,
  initData: '',
  user: null,
  startParam: '',
  isReady: false,
  updateUser: () => {},
};

const TelegramContext = createContext<TelegramContextType>(defaultState);

export const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<Omit<TelegramContextType, 'updateUser'>>({
    webApp: null,
    initData: '',
    user: null,
    startParam: '',
    isReady: false,
  });

  const updateUser = (user: TelegramUser) => {
    setState(prev => ({
      ...prev,
      user,
      isReady: true,
    }));
  };

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
        isReady: true,
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

  return (
    <TelegramContext.Provider value={{ ...state, updateUser }}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
