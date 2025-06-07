interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price?: number;
  isEquipped?: boolean;
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
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = responseText;
      }

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || 'Что-то пошло не так'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Ошибка сети'
      };
    }
  }

  async initUser(initData: string, startParam?: string) {
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData, ref: startParam })
    });
  }

  async getUserData(userId: number, initData?: string) {
    return this.request(`/data?userId=${userId}`, { 
      headers: this.getHeaders(initData) 
    });
  }

  async updateBurnoutLevel(userId: number, level: number, initData?: string) {
    return this.request('/update', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
  }

  async getFriends(userId: number, initData?: string) {
    return this.request(`/friends?userId=${userId}`, { 
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
    return this.request('/shop/sprites', {
      headers: this.getHeaders(initData)
    });
  }
  
  async getSprite(spriteId: number, initData?: string): Promise<ApiResponse<Sprite>> {
    return this.request(`/shop/sprites/${spriteId}`, {
      headers: this.getHeaders(initData)
    });
  }

  async purchaseSprite(
    userId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.request('/shop/purchase', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ userId, spriteId })
    });
  }

  async updateAttemptDate(
    userId: number,
    initData?: string
  ): Promise<ApiResponse> {
    return this.request('/updateAttemptDate', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ userId })
    });
  }

  // Исправлено: возвращаем массив ID спрайтов
  async getOwnedSprites(
  userId: number, 
  initData?: string
): Promise<ApiResponse<number[]>> {
  // Добавить проверку на undefined
  if (userId === undefined || userId === null) {
    return {
      success: false,
      error: 'User ID is missing'
    };
  }
  
  return this.request(`/shop/owned?userId=${userId}`, {
    headers: this.getHeaders(initData)
  });
}

  async equipSprite(
    userId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.request('/shop/equip', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ userId, spriteId })
    });
  }
}

export const api = new Api();
