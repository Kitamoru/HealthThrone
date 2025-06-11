import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { UserProfile, Sprite } from '@/lib/types';

// Интерфейс контекста остается прежним
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

// Создаем контекст и передаем начальное значение
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

// Используем хук для предоставления значения контекста дочерним элементам
export const useAppContext = () => useContext(AppContext);

// Компонент-провайдер контекста
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Внутреннее состояние контекста
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Другие методы и логика обновления состояния

  return (
    <AppContext.Provider
      value={{
        user,
        sprites,
        ownedSprites,
        isLoading,
        error,
        setUser,
        updateUser, // реализуйте этот метод
        setSprites,
        setOwnedSprites,
        refreshSprites, // реализуйте этот метод
        refreshOwnedSprites, // реализуйте этот метод
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
