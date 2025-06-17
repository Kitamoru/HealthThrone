import { ApiResponse, UserProfile, Sprite, Friend } from './types';

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
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders };

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

  async getUserData(telegramId: number): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(`/data?telegramId=${telegramId}`);
  }

  async getFriends(telegramId: string): Promise<ApiResponse<Friend[]>> {
    return this.makeRequest<Friend[]>(`/friends?telegramId=${telegramId}`);
  }

  async deleteFriend(friendId: number): Promise<ApiResponse> {
    return this.makeRequest(`/friends/${friendId}`, 'DELETE');
  }

  async getSprites(): Promise<ApiResponse<Sprite[]>> {
    return this.makeRequest<Sprite[]>('/shop/sprites');
  }

  async purchaseSprite(
    telegramId: number, 
    spriteId: number
  ): Promise<ApiResponse> {
    return this.makeRequest('/shop/purchase', 'POST', { telegramId, spriteId });
  }

  async getOwnedSprites(telegramId: number): Promise<ApiResponse<number[]>> {
    return this.makeRequest<number[]>(`/shop/owned?telegramId=${telegramId}`);
  }

  async equipSprite(
    telegramId: number, 
    spriteId: number
  ): Promise<ApiResponse> {
    return this.makeRequest('/shop/equip', 'POST', { telegramId, spriteId });
  }
  
  async submitSurvey(params: {
    telegramId: number;
    newScore: number;
  }): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(
      '/updateBurnout', 
      'POST', 
      params
    );
  }
}

export const api = new Api();
