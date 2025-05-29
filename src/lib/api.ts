
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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Something went wrong'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async getUserData(userId: number) {
    return this.request(`/data?userId=${userId}`);
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
}

export const api = new Api();
