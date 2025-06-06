interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Определяем интерфейс для Sprite
interface Sprite {
  id: number;
  name: string;
  imageUrl: string;
  price?: number;
  isEquipped?: boolean;
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

  async initUser(initData: string, startParam?: string) {
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData, ref: startParam })
    });
  }

  async getUserData(userId: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request(`/data?userId=${userId}`, { headers });
  }

  async updateBurnoutLevel(userId: number, level: number, initData?: string) {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request('/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
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

  async getSprites(): Promise<ApiResponse<Sprite[]>> {
    return this.request('/shop/sprites');
  }

  async purchaseSprite(
    userId: number, 
    spriteId: number, 
    price: number,
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

  async updateAttemptDate(
    userId: number,
    initData?: string
  ): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return this.request('/updateAttemptDate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId })
    });
  }
}

export const api = new Api();
