import { useEffect, useState, useRef, useCallback } from 'react';

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

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    chat_instance?: string;
    chat_type?: string;
    start_param?: string;
  };
  version: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  
  // Event handling methods
  onEvent: (eventType: string, handler: Function) => void;
  offEvent: (eventType: string, handler: Function) => void;
  
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  showPopup: (params: any, callback?: (buttonId: string) => void) => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  HapticFeedback: TelegramHapticFeedback;
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
    themeParams: {} as TelegramThemeParams,
    colorScheme: 'light' as 'light' | 'dark',
  });

  // Ref to store the actual theme update function
  const updateThemeRef = useRef<() => void>(() => {});

  // Stable callback for theme updates
  const updateTheme = useCallback(() => {
    const telegram = window.Telegram;
    if (!telegram?.WebApp) return;
    const tg = telegram.WebApp;
    setState(prev => ({
      ...prev,
      themeParams: tg.themeParams || {},
      colorScheme: tg.colorScheme || 'light',
    }));
  }, []);

  // Update ref when callback changes
  useEffect(() => {
    updateThemeRef.current = updateTheme;
  }, [updateTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initTelegram = () => {
      const telegram = window.Telegram;
      if (!telegram?.WebApp) return;

      const tg = telegram.WebApp;
      
      // Initialize WebApp
      tg.ready();
      tg.expand();

      // Update state with current data
      setState({
        webApp: tg,
        initData: tg.initData,
        user: tg.initDataUnsafe.user || null,
        startParam: tg.initDataUnsafe.start_param || '',
        isReady: true,
        themeParams: tg.themeParams || {},
        colorScheme: tg.colorScheme || 'light',
      });

      // Theme change handler using ref
      const handleThemeChanged = () => {
        updateThemeRef.current();
      };

      // Subscribe to theme changes
      tg.onEvent('themeChanged', handleThemeChanged);
      
      // Cleanup on unmount
      return () => {
        tg.offEvent('themeChanged', handleThemeChanged);
      };
    };

    const handleReady = () => {
      initTelegram();
      window.removeEventListener('telegram-ready', handleReady);
    };

    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      window.addEventListener('telegram-ready', handleReady);
    }

    return () => {
      window.removeEventListener('telegram-ready', handleReady);
    };
  }, []);

  return {
    ...state,
    isTelegramReady: state.isReady,
    hasContactPicker: !!state.webApp?.showContactPicker,
    hasHapticFeedback: !!state.webApp?.HapticFeedback,
  };
};
