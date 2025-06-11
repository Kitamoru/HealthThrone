import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { UserProfile, Sprite } from '@/lib/types';

type AppContextType = {
  user: UserProfile | null;
  sprites: Sprite[];
  ownedSprites: number[];
  coins: number;
  isLoading: boolean;
  error: string | null;
  telegramId: number | null;
  setUser: (user: UserProfile) => void;
  updateUser: (initData?: string) => Promise<{ success: boolean, error?: string }>;
  setSprites: (sprites: Sprite[]) => void;
  setOwnedSprites: (spriteIds: number[]) => void;
  refreshSprites: (initData?: string) => Promise<void>;
  refreshOwnedSprites: (initData?: string) => Promise<void>;
};

const AppContext = createContext<AppContextType>({
  user: null,
  sprites: [],
  ownedSprites: [],
  coins: 0,
  isLoading: false,
  error: null,
  telegramId: null,
  setUser: () => {},
  updateUser: async () => ({ success: false }),
  setSprites: () => {},
  setOwnedSprites: () => {},
  refreshSprites: async () => {},
  refreshOwnedSprites: async () => {},
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initTelegram = useCallback(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      
      // Явное приведение типа к number
      const userId = tg.initDataUnsafe.user?.id;
      setTelegramId(userId ? Number(userId) : null);
      
      return tg.initData;
    }
    return '';
  }, []);

  const updateUser = useCallback(
    async (initData?: string): Promise<{ success: boolean, error?: string }> => {
      if (!telegramId) {
        return { success: false, error: 'Telegram ID not available' };
      }
      
      setIsLoading(true);
      try {
        const response = await api.getUserData(telegramId, initData);
        if (response.success && response.data) {
          setUser(response.data);
          return { success: true };
        } else {
          throw new Error(response.error || 'Failed to fetch user data');
        }
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [telegramId]
  );

  const refreshSprites = useCallback(async (initData?: string) => {
    setIsLoading(true);
    try {
      const response = await api.getSprites(initData);
      if (response.success && response.data) {
        setSprites(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch sprites');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshOwnedSprites = useCallback(async (initData?: string) => {
    if (!telegramId) return;
    
    setIsLoading(true);
    try {
      const response = await api.getOwnedSprites(telegramId, initData);
      if (response.success && response.data) {
        setOwnedSprites(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch owned sprites');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    const initData = initTelegram();
    if (telegramId) {
      updateUser(initData);
      refreshSprites(initData);
      refreshOwnedSprites(initData);
    }
  }, [telegramId, initTelegram, updateUser, refreshSprites, refreshOwnedSprites]);

  return (
    <AppContext.Provider
      value={{
        user,
        sprites,
        ownedSprites,
        coins: user?.coins ?? 0,
        isLoading,
        error,
        telegramId,
        setUser,
        updateUser,
        setSprites,
        setOwnedSprites,
        refreshSprites,
        refreshOwnedSprites,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
