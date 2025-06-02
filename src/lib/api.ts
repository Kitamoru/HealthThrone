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

  // Новые методы для работы с друзьями
  async getFriends() {
    console.log('[API] Fetching friends list');
    return this.request('/friends');
  }

  async addFriend(friendUsername: string) {
    console.log(`[API] Adding friend: @${friendUsername}`);
    return this.request('/friends', {
      method: 'POST',
      body: JSON.stringify({ friendUsername })
    });
  }

  async deleteFriend(friendId: number) {
    console.log(`[API] Deleting friend with ID: ${friendId}`);
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE'
    });
  }
}

export const api = new Api();
