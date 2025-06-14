import { ApiResponse, UserProfile, Sprite, Friend } from './types';

class Api {
  private baseUrl = '/api';
  private defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: object,
    initData?: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = { ...this.defaultHeaders };
    
    if (initData) headers['X-Telegram-Init-Data'] = initData;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          status: response.status,
          error: errorText || 'Ошибка запроса'
        };
      }

      const data: T = await response.json();
      return { success: true, status: response.status, data };
    } catch (error: any) {
      return {
        success: false,
        status: 0,
        error: error.name === 'AbortError' 
          ? 'Запрос отменен' 
          : 'Сетевая ошибка'
      };
    }
  }

  // Корректные пути API
  async getSprites(initData?: string): Promise<ApiResponse<Sprite[]>> {
    return this.makeRequest<Sprite[]>('/sprites', 'GET', undefined, initData);
  }

  async purchaseSprite(
    telegramId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.makeRequest(
      '/purchase', 
      'POST', 
      { telegramId, spriteId },
      initData
    );
  }

  async equipSprite(
    telegramId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.makeRequest(
      '/equip', 
      'POST', 
      { telegramId, spriteId },
      initData
    );
  }

  async getFriends(userId: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/friends?userId=${userId}`, { headers });
  }

  async addFriend(friendUsername: string, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request('/friends', {
      method: 'POST',
      headers,
      body: JSON.stringify({ friendUsername })
    });
  }

  async deleteFriend(friendId: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
      headers
    });
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
