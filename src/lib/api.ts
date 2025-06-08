interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  isArray?: boolean; // Добавляем флаг массива
}

export interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price: number;
  created_at?: string;
  isEquipped?: boolean;
}

export type UserProfile = {
  id: number;
  telegram_id: number;
  created_at: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  burnout_level: number;
  last_attempt_date?: string | null;
  coins: number;
  updated_at: string;
  current_sprite_id?: number;
  last_login_date?: string;
};

class Api {
  private baseUrl = '/api';

  private getHeaders(initData?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    try {
      console.log(`[API] ${options.method || 'GET'} ${url}`, {
        headers: options.headers,
        body: options.body
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      const responseTime = Date.now() - startTime;
      const status = response.status;
      const responseClone = response.clone(); // Для безопасного чтения

      // Упрощенная обработка ошибок
      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          const errorResponse = await responseClone.json();
          errorText = errorResponse.error || JSON.stringify(errorResponse);
        } catch {
          errorText = await responseClone.text();
        }

        console.error(`[API] Error ${status} (${responseTime}ms): ${errorText}`);
        return {
          success: false,
          status,
          error: errorText
        };
      }

      const data: T = await response.json();
      console.log(`[API] Success ${status} (${responseTime}ms):`, data);
      
      return { 
        success: true, 
        status,
        data 
      };
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error(`[API] Network error (${responseTime}ms):`, error);
      
      return {
        success: false,
        status: 0,
        error: error.message || 'Network request failed'
      };
    }
  }

  async initUser(initData: string, startParam?: string) {
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData, ref: startParam })
    });
  }

  async getUserData(telegramId: string, initData?: string): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>(`/data?telegramId=${telegramId}`, {
      headers: this.getHeaders(initData)
    });
  }

  async updateBurnoutLevel(telegramId: string, level: number, initData?: string) {
    return this.request('/update', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ telegramId, burnoutLevel: level })
    });
  }

  async getFriends(telegramId: string, initData?: string) {
    return this.request(`/friends?telegramId=${telegramId}`, {
      headers: this.getHeaders(initData)
    });
  }

  async addFriend(friendUsername: string, initData?: string) {
    return this.request('/friends', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ friendUsername })
    });
  }

  async deleteFriend(friendId: string, initData?: string) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
      headers: this.getHeaders(initData)
    });
  }

  async getSprites(initData?: string): Promise<ApiResponse<Sprite[]>> {
    return this.request<Sprite[]>('/shop/sprites', {
      headers: this.getHeaders(initData)
    });
  }
  
  async getSprite(spriteId: number, initData?: string): Promise<ApiResponse<Sprite>> {
    return this.request<Sprite>(`/shop/sprites/${spriteId}`, {
      headers: this.getHeaders(initData)
    });
  }

  async purchaseSprite(
    telegramId: string, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.request('/shop/purchase', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ telegramId, spriteId })
    });
  }

  async updateAttemptDate(
    telegramId: string,
    initData?: string
  ): Promise<ApiResponse> {
    return this.request('/updateAttemptDate', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ telegramId })
    });
  }

  async getOwnedSprites(
    telegramId: string, 
    initData?: string
  ): Promise<ApiResponse<number[]>> {
    return this.request<number[]>(`/shop/owned?telegramId=${telegramId}`, {
      headers: this.getHeaders(initData)
    });
  }

  async equipSprite(
    telegramId: string, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.request('/shop/equip', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ telegramId, spriteId })
    });
  }
  
  async submitSurvey(params: {
    telegramId: string;
    newScore: number;
    initData?: string;
  }): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/updateBurnout', {
      method: 'POST',
      headers: this.getHeaders(params.initData),
      body: JSON.stringify({
        telegramId: params.telegramId,
        newScore: params.newScore
      })
    });
  }
}

export const api = new Api();
