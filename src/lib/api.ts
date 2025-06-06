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
}

class Api {
  private baseUrl = '/api';

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Something went wrong'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Инициализация пользователя
  async initUser(initData: string, startParam?: string) {
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData, ref: startParam })
    });
  }

  // Получение данных пользователя
  async getUserData(userId: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/data?userId=${userId}`, { headers });
  }

  // Обновление уровня выгорания
  async updateBurnoutLevel(userId: number, level: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request('/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
  }

  // Получение списка друзей
  async getFriends(userId: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/friends?userId=${userId}`, { headers });
  }

  // Добавление друга
  async addFriend(friendUsername: string, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request('/friends', {
      method: 'POST',
      headers,
      body: JSON.stringify({ friendUsername })
    });
  }

  // Удаление друга
  async deleteFriend(friendId: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
      headers
    });
  }

 // Получение данных пользователя
  async getUserData(userId: number, initData?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/data?userId=${userId}`, { headers });
  }

  // Получение всех спрайтов
  async getSprites(): Promise<ApiResponse<Sprite[]>> {
    return this.request('/shop/sprites');
  }
  
  // Покупка спрайта
  async purchaseSprite(
    userId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    
    return this.request('/shop/purchase', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, spriteId })
    });
  }
}

export const api = new Api();
