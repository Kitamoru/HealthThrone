import { ApiResponse, UserProfile, Sprite, Friend } from './types';

class Api {
  private baseUrl = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const responseTime = Date.now();
    const status = response.status;
    const responseClone = response.clone();

    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        const errorResponse = await responseClone.json();
        errorText = errorResponse.error || JSON.stringify(errorResponse);
      } catch {
        try {
          errorText = await responseClone.text();
        } catch (textError) {
          errorText = 'Failed to parse error response';
        }
      }
      console.error(`[API] Error ${status}: ${errorText}`); // Логируем ошибки прямо здесь
      return {
        success: false,
        status,
        error: errorText
      };
    }

    try {
      const data: T = await response.json();
      console.log(`[API] Success ${status}: Received data`, data); // 👇👇 Лог принимаемых данных
      return { 
        success: true, 
        status,
        data 
      };
    } catch (parseError) {
      console.error('[API] Failed to parse response:', parseError);
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

    const startTime = Date.now();
    console.log(`[API] ${method} ${url}`, {
      headers,
      body: body ? JSON.stringify(body) : undefined
    }); // 👇 Лог отправляемых запросов

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const result = await this.handleResponse<T>(response);
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`[API] Success ${result.status} (${duration}ms):`, result.data); // 👇 Лог успешных ответов
      } else {
        console.error(`[API] Error ${result.status} (${duration}ms): ${result.error}`); // 👇 Лог ошибок
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[API] Network error (${duration}ms):`, error); // 👇 Лог сетевых ошибок

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
