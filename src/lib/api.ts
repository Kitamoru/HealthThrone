import { ApiResponse, UserProfile, Sprite, Friend } from './types';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export const useUserData = (telegramId: number, initData?: string) => {
  return useQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId, initData),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFriendsData = (telegramId: string, initData?: string) => {
  return useQuery({
    queryKey: ['friends', telegramId],
    queryFn: () => api.getFriends(telegramId, initData),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSpritesData = (initData?: string) => {
  return useQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
    staleTime: 10 * 60 * 1000,
  });
};

export const useOwnedSprites = (telegramId: number, initData?: string) => {
  return useQuery({
    queryKey: ['ownedSprites', telegramId],
    queryFn: () => api.getOwnedSprites(telegramId, initData),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubmitSurvey = () => {
  return useMutation({
    mutationFn: (params: { 
      telegramId: number; 
      newScore: number; 
      initData?: string 
    }) => api.submitSurvey(params),
  });
};

export const usePurchaseSprite = () => {
  return useMutation({
    mutationFn: (params: {
      telegramId: number;
      spriteId: number;
      initData?: string;
    }) => api.purchaseSprite(params.telegramId, params.spriteId, params.initData),
  });
};

export const useEquipSprite = () => {
  return useMutation({
    mutationFn: (params: {
      telegramId: number;
      spriteId: number;
      initData?: string;
    }) => api.equipSprite(params.telegramId, params.spriteId, params.initData),
  });
};

class Api {
  private baseUrl = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      try {
        const errorResponse = await response.json();
        return {
          success: false,
          status: response.status,
          error: errorResponse.error || JSON.stringify(errorResponse)
        };
      } catch {
        return {
          success: false,
          status: response.status,
          error: await response.text()
        };
      }
    }

    try {
      return await response.json();
    } catch (parseError) {
      return {
        success: false,
        status: 500,
        error: 'Failed to parse response data'
      };
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    initData?: string
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      return {
        success: false,
        status: 0,
        error: error.message || 'Network request failed'
      };
    }
  }

  async initUser(initData: string, startParam?: string) {
    return this.makeRequest('/init', 'POST', { initData, ref: startParam });
  }

  async getUserData(telegramId: number, initData?: string): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(
      `/data?telegramId=${telegramId}`, 
      'GET', 
      undefined, 
      initData
    );
  }

  async updateBurnoutLevel(telegramId: number, level: number, initData?: string) {
    return this.makeRequest(
      '/update', 
      'POST', 
      { telegramId, burnoutLevel: level },
      initData
    );
  }

  async getFriends(telegramId: string, initData?: string): Promise<ApiResponse<Friend[]>> {
    return this.makeRequest<Friend[]>(
      `/friends?telegramId=${telegramId}`, 
      'GET', 
      undefined, 
      initData
    );
  }

  async addFriend(friendUsername: string, initData?: string): Promise<ApiResponse> {
    return this.makeRequest(
      '/friends', 
      'POST', 
      { friendUsername },
      initData
    );
  }

  async deleteFriend(friendId: number, initData?: string): Promise<ApiResponse> {
    return this.makeRequest(
      `/friends/${friendId}`, 
      'DELETE', 
      undefined, 
      initData
    );
  }

  async getSprites(initData?: string): Promise<ApiResponse<Sprite[]>> {
    return this.makeRequest<Sprite[]>('/shop/sprites', 'GET', undefined, initData);
  }
  
  async getSprite(spriteId: number, initData?: string): Promise<ApiResponse<Sprite>> {
    return this.makeRequest<Sprite>(
      `/shop/sprites/${spriteId}`, 
      'GET', 
      undefined, 
      initData
    );
  }

  async purchaseSprite(
    telegramId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.makeRequest(
      '/shop/purchase', 
      'POST', 
      { telegramId, spriteId },
      initData
    );
  }

  async getOwnedSprites(
    telegramId: number, 
    initData?: string
  ): Promise<ApiResponse<number[]>> {
    return this.makeRequest<number[]>(
      `/shop/owned?telegramId=${telegramId}`, 
      'GET', 
      undefined, 
      initData
    );
  }

  async equipSprite(
    telegramId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.makeRequest(
      '/shop/equip', 
      'POST', 
      { telegramId, spriteId },
      initData
    );
  }
  
  async submitSurvey(params: {
    telegramId: number;
    newScore: number;
    initData?: string;
  }): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(
      '/updateBurnout', 
      'POST', 
      {
        telegramId: params.telegramId,
        newScore: params.newScore
      },
      params.initData
    );
  }
}

export const api = new Api();

_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import '../styles/globals.css';

// Prefetch shop data
const prefetchShopData = (initData?: string) => {
  if (typeof window !== 'undefined') {
    queryClient.prefetchQuery({
      queryKey: ['sprites'],
      queryFn: () => api.getSprites(initData),
    });
  }
};

const Loader = dynamic(
  () => import('../components/Loader').then(mod => mod.Loader),
  {
    ssr: false,
    loading: () => <div>Загрузка...</div>
  }
);

function App({ Component, pageProps }: AppProps) {
  const { initData, startParam, webApp } = useTelegram();
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    if (initData) {
      api.initUser(initData, startParam)
        .then(response => {
          if (response.success) {
            console.log('User initialized successfully');
          }
        })
        .finally(() => setUserInitialized(true));
    }
  }, [initData, startParam]);

  useEffect(() => {
    if (webApp && initData) {
      // Prefetch shop data when app is ready
      prefetchShopData(initData);
    }
  }, [webApp, initData]);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Burnout Tracker - Отслеживание выгорания</title>
        <meta name="description" content="Telegram Mini App для отслеживания уровня выгорания" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18222d" />
      </Head>

      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive" 
        onLoad={() => {
          if (window.Telegram?.WebApp) {
            window.dispatchEvent(new Event('telegram-ready'));
          }
        }}
      />

      {userInitialized ? 
        <div className="page-transition">
          <Component {...pageProps} />
        </div> : 
        <Loader />
      }
    </QueryClientProvider>
  );
}

export default App;
