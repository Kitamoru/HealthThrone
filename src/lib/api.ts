import { ApiResponse, UserProfile, Sprite, Friend } from './types';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';

interface SubmitSurveyRequest {
  telegramId: number;
  burnoutDelta: number;
  factors: number[];
  initData?: string;
}

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
    mutationFn: (params: SubmitSurveyRequest) => api.submitSurvey(params),
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

export const useUpdateUserClass = () => {
  return useMutation({
    mutationFn: (params: {
      telegramId: number;
      characterClass: string;
      initData?: string;
    }) => api.updateUserClass(params.telegramId, params.characterClass, params.initData),
  });
};

export const useOctalysisFactors = (userId?: number, initData?: string) => {
  return useQuery({
    queryKey: ['octalysisFactors', userId],
    queryFn: async () => {
      if (!userId) return [0,0,0,0,0,0,0,0];
      
      const response = await api.getOctalysisFactors(userId, initData);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [0,0,0,0,0,0,0,0];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 минут кеширования
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

  async initUser(initData: string, startParam?: string): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/init', 'POST', { initData, ref: startParam });
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
  
  async submitSurvey(params: SubmitSurveyRequest): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(
      '/updateBurnout', 
      'POST', 
      {
        telegramId: params.telegramId,
        burnoutDelta: params.burnoutDelta,
        factors: params.factors
      },
      params.initData
    );
  }

  async updateUserClass(
    telegramId: number,
    characterClass: string, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.makeRequest(
      '/onboarding', 
      'POST', 
      { 
        telegram_id: telegramId,
        character_class: characterClass 
      }, 
      initData
    );
  }

  async getOctalysisFactors(
    userId: number, 
    initData?: string
  ): Promise<ApiResponse<number[]>> {
    return this.makeRequest<number[]>(
      `/octalysis?userId=${userId}`, 
      'GET', 
      undefined, 
      initData
    );
  }
}

export const api = new Api();
