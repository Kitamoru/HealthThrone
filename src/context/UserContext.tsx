import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { useTelegram } from '../hooks/useTelegram';

// Типы определены корректно

interface TelegramInitData {
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
  };
  query_id?: string;
  auth_date?: string;
  hash?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  fetchUser: (telegramId: number, initData: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { initData: initDataString } = useTelegram() || {}; // Добавлена защита от отсутствия initData

  let initData: TelegramInitData | null = null;
  if (initDataString) {
    try {
      initData = JSON.parse(initDataString); // Улучшена обработка возможного исключения
    } catch(e) {
      console.error("Ошибка разбора initData:", e.message);
    }
  }

  const fetchUser = async (telegramId: number, initData: string) => {
    if (!initData.trim()) { // Проверка на пустоту перед использованием
      return { success: false, error: 'Empty or invalid initData provided.' };
    }
    
    setIsLoading(true);
    try {
      const response = await api.getUserData(telegramId, initData);
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        console.error(`API error while fetching user data for ${telegramId}:`, response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error(`Network error while fetching user data for ${telegramId}:`, error.message);
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (initData && initData.user?.id) {
        const telegramId = initData.user.id;
        await fetchUser(telegramId, initDataString!);
      }
    };

    loadUserData();
  }, [initDataString]);

  const value = {
    user,
    isLoading,
    fetchUser,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
