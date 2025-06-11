import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { UserProfile, Sprite } from '@/lib/types';

type AppContextType = {
  user: UserProfile | null;
  sprites: Sprite[];
  ownedSprites: number[];
  coins: number; // добавляем coins в интерфейс
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile) => void;
  updateUser: (telegramId: number, initData?: string) => Promise<{ success: boolean, error?: string }>; // Изменили сигнатуру
  setSprites: (sprites: Sprite[]) => void;
  setOwnedSprites: (spriteIds: number[]) => void;
  refreshSprites: (initData?: string) => Promise<void>;
  refreshOwnedSprites: (telegramId: number, initData?: string) => Promise<void>;
};

// Создаем context с указанием типа
const AppContext = createContext<AppContextType>({
  user: null,
  sprites: [],
  ownedSprites: [],
  coins: 0, // устанавливаем начальное значение для coins
  isLoading: false,
  error: null,
  setUser: () => {},
  updateUser: async () => ({ success: false }), // Возвращаем пустой объект по умолчанию
  setSprites: () => {},
  setOwnedSprites: () => {},
  refreshSprites: async () => {},
  refreshOwnedSprites: async () => {},
});

// Хук для удобного использования контекста
export const useAppContext = () => useContext(AppContext);

// Провайдер контекста
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обновление данных пользователя
  const updateUser = useCallback(
    async (telegramId: number, initData?: string): Promise<{ success: boolean, error?: string }> => {
      setIsLoading(true);
      try {
        const response = await api.getUserData(telegramId, initData);
        if (response.success && response.data) {
          setUser(response.data);
          return { success: true }; // Добавляем возврат успешного результата
        } else {
          throw new Error(response.error || 'Failed to fetch user data');
        }
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message }; // Добавляем возврат ошибочного результата
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Загрузка спрайтов магазина
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

  // Обновление купленных спрайтов
  const refreshOwnedSprites = useCallback(async (telegramId: number, initData?: string) => {
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
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        sprites,
        ownedSprites,
        coins: user?.coins ?? 0, // Присваиваем значение coins динамически
        isLoading,
        error,
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
