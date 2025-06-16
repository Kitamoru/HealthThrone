import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import type { UserProfile, Sprite, Friend, ApiResponse } from './types';

class Api {
  private baseUrl = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;
    const responseClone = response.clone();
    
    if (!response.ok) {
      try {
        const errorResponse = await responseClone.json();
        return {
          success: false,
          status,
          error: errorResponse.error || JSON.stringify(errorResponse)
        };
      } catch {
        try {
          return {
            success: false,
            status,
            error: await responseClone.text()
          };
        } catch (textError) {
          return {
            success: false,
            status,
            error: 'Failed to parse error response'
          };
        }
      }
    }

    try {
      const responseData = await response.json();
      
      if (responseData.success && responseData.data !== undefined) {
        return {
          success: true,
          status,
          data: responseData.data
        };
      }
      
      return {
        success: false,
        status: 500,
        error: 'Invalid server response structure'
      };
      
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

// React Query Hooks
export const useUserData = (telegramId: number, initData?: string) => {
  return useQuery<UserProfile, Error>({
    queryKey: ['user', telegramId],
    queryFn: async () => {
      const response = await api.getUserData(telegramId, initData);
      
      if (!response.success) {
        throw new Error(response.error || "Ошибка загрузки данных пользователя");
      }
      
      return response.data;
    },
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Не повторять для 404 ошибок
      return error.message !== 'User not found' && failureCount < 2;
    }
  });
};

export const useFriendsData = (telegramId: string, initData?: string) => {
  return useQuery<Friend[], Error>({
    queryKey: ['friends', telegramId],
    queryFn: async () => {
      const response = await api.getFriends(telegramId, initData);
      
      if (!response.success) {
        throw new Error(response.error || "Ошибка загрузки списка друзей");
      }
      
      return response.data;
    },
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSpritesData = (initData?: string) => {
  return useQuery<Sprite[], Error>({
    queryKey: ['sprites'],
    queryFn: async () => {
      const response = await api.getSprites(initData);
      
      if (!response.success) {
        throw new Error(response.error || "Ошибка загрузки спрайтов");
      }
      
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useSubmitSurvey = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UserProfile, Error, { 
    telegramId: number; 
    newScore: number; 
    initData?: string 
  }>({
    mutationFn: async (params) => {
      const response = await api.submitSurvey(params);
      
      if (!response.success) {
        throw new Error(response.error || 'Ошибка сохранения результатов опроса');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Автоматическое обновление кэша пользователя
      queryClient.setQueryData(['user', variables.telegramId], data);
    }
  });
};

export const useDeleteFriend = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { friendId: number; initData?: string }) => 
      api.deleteFriend(params.friendId, params.initData),
    onSuccess: (_, variables, context) => {
      // Инвалидация кэша друзей
      queryClient.invalidateQueries(['friends']);
    }
  });
};

// Prefetch functions
export const prefetchUserData = (
  queryClient: QueryClient,
  telegramId: number,
  initData?: string
) => {
  return queryClient.prefetchQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId, initData),
  });
};

export const prefetchFriendsData = (
  queryClient: QueryClient,
  telegramId: string,
  initData?: string
) => {
  return queryClient.prefetchQuery({
    queryKey: ['friends', telegramId],
    queryFn: () => api.getFriends(telegramId, initData),
  });
};

export const prefetchSpritesData = (
  queryClient: QueryClient,
  initData?: string
) => {
  return queryClient.prefetchQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
  });
};
