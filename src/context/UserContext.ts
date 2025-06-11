import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { UserProfile, Sprite } from '@/lib/types';

// Определение интерфейса контекста
interface AppContextType {
  user: UserProfile | null;
  sprites: Sprite[];
  ownedSprites: number[];
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile) => void;
  updateUser: (telegramId: number, initData?: string) => Promise<void>;
  setSprites: (sprites: Sprite[]) => void;
  setOwnedSprites: (spriteIds: number[]) => void;
  refreshSprites: (initData?: string) => Promise<void>;
  refreshOwnedSprites: (telegramId: number, initData?: string) => Promise<void>;
}

// Создание контекста
const AppContext = createContext<AppContextType>({
  user: null,
  sprites: [],
  ownedSprites: [],
  isLoading: false,
  error: null,
  setUser: () => {},
  updateUser: async () => {},
  setSprites: () => {},
  setOwnedSprites: () => {},
  refreshSprites: async () => {},
  refreshOwnedSprites: async () => {},
});

// Хук для подключения контекста
export const useAppContext = () => useContext(AppContext);

// Обертка провайдера
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функционал обработки асинхронных операций и обновление состояния
  
  return (
    <AppContext.Provider
      value={{
        user,
        sprites,
        ownedSprites,
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
