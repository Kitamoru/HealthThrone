interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class Api {
  private baseUrl = '/api';

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      console.log(`API request to: ${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`API response status: ${response.status}`);

      // Обрабатываем случаи, когда ответ не JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`API response data:`, data);

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
      console.error('API request failed:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getUserData(userId: number) {
    console.log(`Fetching user data for ID: ${userId}`);
    return this.request(`/data?userId=${userId}`);
  }

  async updateBurnoutLevel(userId: number, level: number) {
    console.log(`Updating burnout level for user ${userId} to ${level}`);
    return this.request('/update', {
      method: 'POST',
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
  }

  async initUser(initData: string) {
    console.log('Initializing user with initData');
    return this.request('/init', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });
  }
}

export const api = new Api();
