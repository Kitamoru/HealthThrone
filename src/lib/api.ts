import { Friend } from './supabase'; // Добавлен импорт Friend

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class Api {
  private baseUrl = '/api';

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      console.log(`[API] Making request to: ${endpoint}`);
      console.log(`[API] Request options:`, options);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`[API] Response status: ${response.status}`);
      
      // Обрабатываем случаи, когда ответ не JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`[API] Response data:`, data);

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
      console.error('[API] Request failed:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getUserData(userId: number) {
    console.log(`[API] Fetching user data for ID: ${userId}`);
    return this.request(`/data?userId=${userId}`);
  }

  async updateBurnoutLevel(userId: number, level: number) {
    console.log(`[API] Updating burnout level for user ${userId} to ${level}`);
    return this.request('/update', {
      method: 'POST',
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
  }

  async initUser(initData: string) {
    console.log('[API] Initializing user with initData');
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });
  }

  async getFriends(userId: number) {
    return this.request<Friend[]>(`/friends?userId=${userId}`);
  }

  async addFriend(userId: number, friendTelegramId: number, friendUsername: string) {
    return this.request('/friends', {
      method: 'POST',
      body: JSON.stringify({ 
        userId, 
        friendTelegramId, 
        friendUsername 
      })
    });
  }

  async removeFriend(userId: number, friendId: number) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }
}

export const api = new Api();
