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

const AppContext = createContext<AppContextType>({
  user: null,
  coins: 0,
  sprites: [],
  ownedSprites: [],
  setUser: () => {},
  setCoins: () => {},
  setSprites: () => {},
  setOwnedSprites: () => {},
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [coins, setCoins] = useState(0);
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [ownedSprites, setOwnedSprites] = useState<number[]>([]);

  return (
    <AppContext.Provider value={{
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
