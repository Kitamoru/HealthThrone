import { Friend } from './supabase';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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

      // Обрабатываем случаи, когда ответ не JSON
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

  async getUserData(userId: number) {
    return this.request<UserProfile>(`/data?userId=${userId}`);
  }

  async updateBurnoutLevel(userId: number, level: number) {
    return this.request('/update', {
      method: 'POST',
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
  }

  async initUser(initData: string) {
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });
  }

  // Новые методы для работы с друзьями
  async generateInviteLink(userId: number): Promise<ApiResponse<{ link: string }>> {
    return this.request('/generate-invite', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async getFriends(userId: number): Promise<ApiResponse<Friend[]>> {
    return this.request(`/friends?userId=${userId}`);
  }

  async acceptInvite(userId: number, inviteCode: string): Promise<ApiResponse> {
    return this.request('/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ userId, inviteCode })
    });
  }
}

export const api = new Api();
