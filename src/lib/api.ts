interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price: number;
  created_at?: string;
  isEquipped?: boolean;
}

export interface UserProfile {
  id: string;
  telegram_id: string;
  created_at: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  burnout_level: number;
  last_attempt_date?: string | null;
}

class Api {
  private baseUrl = '/api';

  private getHeaders(initData?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      // Обработка HTTP ошибок
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            error: errorData.error || `HTTP Error ${response.status}`
          };
        } catch {
          return {
            success: false,
            error: errorText || `HTTP Error ${response.status}`
          };
        }
      }

      // Успешный ответ
      const data: T = await response.json();
      return { success: true, data };
      
    } catch (error: any) {
      // Сетевые ошибки
      return {
        success: false,
        error: error.message || 'Network error'
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
    const params = new URLSearchParams({ 
      telegramId, 
      _t: Date.now().toString() 
    });
    
    return this.request<UserProfile>(`/data?${params}`, {
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
    const params = new URLSearchParams({ 
      telegramId, 
      _t: Date.now().toString() 
    });
    
    return this.request(`/friends?${params}`, {
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

  async deleteFriend(friendId: number, initData?: string) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
      headers: this.getHeaders(initData)
    });
  }

  async getSprites(initData?: string): Promise<ApiResponse<Sprite[]>> {
    const params = new URLSearchParams({ 
      _t: Date.now().toString() 
    });
    
    return this.request<Sprite[]>(`/shop/sprites?${params}`, {
      headers: this.getHeaders(initData)
    });
  }
  
  async getSprite(spriteId: number, initData?: string): Promise<ApiResponse<Sprite>> {
    const params = new URLSearchParams({ 
      _t: Date.now().toString() 
    });
    
    return this.request<Sprite>(`/shop/sprites/${spriteId}?${params}`, {
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
    const params = new URLSearchParams({ 
      telegramId, 
      _t: Date.now().toString() 
    });
    
    return this.request<number[]>(`/shop/owned?${params}`, {
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
