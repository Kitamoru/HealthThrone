import { 
  ApiResponse, 
  UserProfile, 
  Sprite, 
  Friend, 
  OctalysisFactors,
  TransformedFriend
} from './types';
import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';

interface SubmitSurveyRequest {
  telegramId: number;
  burnoutDelta: number;
  factors: number[];
  initData?: string;
}

// Унифицированная фабрика для создания query хуков
const createQuery = <T, R = T>(
  key: any[],
  queryFn: () => Promise<ApiResponse<T>>,
  options: Omit<UseQueryOptions<ApiResponse<T>, Error, R>, 'queryKey' | 'queryFn'> = {}
) => {
  return useQuery<ApiResponse<T>, Error, R>({
    queryKey: key,
    queryFn,
    ...options
  });
};

export const useUserData = (telegramId: number, initData?: string) => {
  return createQuery<UserProfile>(
    ['user', telegramId],
    () => api.getUserData(telegramId, initData),
    {
      enabled: !!telegramId,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: 1000
    }
  );
};

export const useFriendsData = (telegramId: number, initData?: string) => {
  return createQuery<Friend[], TransformedFriend[]>(
    ['friends', telegramId],
    () => api.getFriends(telegramId.toString(), initData),
    {
      enabled: !!telegramId,
      staleTime: 5 * 60 * 1000,
      select: (data: ApiResponse<Friend[]>) => {
        if (!data.success || !data.data) return [];
        return data.data.map(f => ({
          id: f.id,
          friend_id: f.friend.id,
          friend_username: f.friend.username || 
                         `${f.friend.first_name} ${f.friend.last_name || ''}`.trim(),
          burnout_level: f.friend.burnout_level
        }));
      }
    }
  );
};

export const useSpritesData = (initData?: string) => {
  return createQuery<Sprite[]>(
    ['sprites'],
    () => api.getSprites(initData),
    {
      staleTime: 10 * 60 * 1000,
      retry: 2
    }
  );
};

export const useOwnedSprites = (telegramId: number, initData?: string) => {
  return createQuery<number[], number[]>(
    ['ownedSprites', telegramId],
    () => api.getOwnedSprites(telegramId, initData),
    {
      enabled: !!telegramId,
      staleTime: 5 * 60 * 1000,
      select: (data: ApiResponse<number[]>) => 
        data.success ? data.data || [] : []
    }
  );
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
    }) => api.updateUserClass(
      params.telegramId, 
      params.characterClass, 
      params.initData
    ),
  });
};

export const useOctalysisFactors = (userId?: number, initData?: string) => {
  return useQuery<OctalysisFactors>({
    queryKey: ['octalysisFactors', userId],
    queryFn: async () => {
      if (!userId) return [0,0,0,0,0,0,0,0];
      
      const response = await api.getOctalysisFactors(userId, initData);
      if (response.success && Array.isArray(response.data)) {
        return response.data as OctalysisFactors;
      }
      return [0,0,0,0,0,0,0,0];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1
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

  async initUser(initData: string, ref?: string): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/init', 'POST', { initData, ref });
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
