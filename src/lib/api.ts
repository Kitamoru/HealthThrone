import { ApiResponse, UserProfile, Sprite, Friend } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

  // User-related methods
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

  // Friends methods
  async getFriends(initData?: string): Promise<ApiResponse<Friend[]>> {
    return this.makeRequest<Friend[]>(
      `/friends`, 
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

  // Shop methods
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
  
  // Survey methods
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

// React Query hooks with caching
export const useUserData = (telegramId: number, initData?: string) => {
  return useQuery({
    queryKey: ['user', telegramId],
    queryFn: () => api.getUserData(telegramId, initData),
    enabled: !!telegramId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};

export const useFriendsData = (initData?: string) => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => api.getFriends(initData),
    enabled: !!initData,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};

export const useSpritesData = (initData?: string) => {
  return useQuery({
    queryKey: ['sprites'],
    queryFn: () => api.getSprites(initData),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};

export const useSubmitSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { 
      telegramId: number; 
      newScore: number; 
      initData?: string 
    }) => api.submitSurvey(params),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ 
          queryKey: ['user', variables.telegramId] 
        });
      }
    }
  });
};

export const useDeleteFriend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { friendId: number; initData?: string }) => 
      api.deleteFriend(params.friendId, params.initData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

export const useAddFriend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { friendUsername: string; initData?: string }) => 
      api.addFriend(params.friendUsername, params.initData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

export const usePurchaseSprite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { 
      telegramId: number; 
      spriteId: number; 
      initData?: string 
    }) => api.purchaseSprite(params.telegramId, params.spriteId, params.initData),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ 
          queryKey: ['user', variables.telegramId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['sprites'] 
        });
      }
    }
  });
};

export const useEquipSprite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { 
      telegramId: number; 
      spriteId: number; 
      initData?: string 
    }) => api.equipSprite(params.telegramId, params.spriteId, params.initData),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ 
          queryKey: ['user', variables.telegramId] 
        });
      }
    }
  });
};
