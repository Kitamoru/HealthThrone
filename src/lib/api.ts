import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfile, Sprite, Friend } from './types';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

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

  async getFriends(telegramId: string, initData?: string): Promise<ApiResponse<Friend[]>> {
    return this.makeRequest<Friend[]>(
      `/friends?telegramId=${telegramId}`, 
      'GET', 
      undefined, 
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
  return useQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId, initData),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFriendsData = (telegramId: string, initData?: string) => {
  return useQuery<Friend[], Error>({
    queryKey: ['friends', telegramId],
    queryFn: async () => {
      if (!telegramId) return [];
      const response = await api.getFriends(telegramId, initData);
      if (response.success) {
        return response.data ?? [];
      }
      throw new Error(response.error || 'Failed to fetch friends');
    },
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

export const useSubmitSurvey = () => {
  return useMutation({
    mutationFn: (params: { 
      telegramId: number; 
      newScore: number; 
      initData?: string 
    }) => api.submitSurvey(params),
  });
};

export const useDeleteFriend = () => {
  return useMutation({
    mutationFn: (params: { friendId: number; initData?: string }) => 
      api.deleteFriend(params.friendId, params.initData)
  });
};
