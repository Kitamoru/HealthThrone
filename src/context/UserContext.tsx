import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { useTelegram } from '../hooks/useTelegram';

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  fetchUser: (telegramId: number, initData: string) => Promise<void>;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { initData } = useTelegram();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUser = async (telegramId: number, initData: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsLoading(true);
    try {
      const response = await api.getUserData(
        telegramId, 
        initData
      );
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Ошибка загрузки данных');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Ошибка загрузки пользователя:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const updateUser = (updatedUser: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  };

  useEffect(() => {
    if (!initData?.user?.id) return;
    const telegramId = initData.user.id;
    fetchUser(telegramId, initData);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [initData]);

  const value = { user, isLoading, fetchUser, updateUser };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser используется вне UserProvider');
  return context;
};
