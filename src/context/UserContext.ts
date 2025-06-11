// Правильно объявляем контекст на верхнем уровне файла
import { createContext, useContext, useState } from 'react';
import { UserProfile, Sprite } from '@/lib/types';

type AppContextType = {
  user: UserProfile | null;
  coins: number;
  sprites: Sprite[];
  ownedSprites: number[];
  setUser: (user: UserProfile) => void;
  setCoins: (coins: number) => void;
  setSprites: (sprites: Sprite[]) => void;
  setOwnedSprites: (spriteIds: number[]) => void;
};

// Создаем контекст с начальным состоянием
export const AppContext = createContext<AppContextType>({
  user: null,
  coins: 0,
  sprites: [],
  ownedSprites: [],
  setUser: () => {},
  setCoins: () => {},
  setSprites: () => {},
  setOwnedSprites: () => {}
});

// Используем хук для получения текущего контекста
export const useAppContext = () => useContext(AppContext);

// Компонент-провайдер контекста
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [coins, setCoins] = useState(0);
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);

  return (
    <AppContext.Provider value={{ // Теперь context доступен!
      user,
      coins,
      sprites,
      ownedSprites,
      setUser,
      setCoins,
      setSprites,
      setOwnedSprites
    }}>
      {children}
    </AppContext.Provider>
  );
};
