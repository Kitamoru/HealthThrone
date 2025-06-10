import { ApiResponse, UserProfile, Sprite, Friend } from './types';

class Api {
  private baseUrl = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const responseTime = Date.now();
    const status = response.status;
    const responseClone = response.clone();

    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        const errorResponse = await responseClone.json();
        errorText = errorResponse.error || JSON.stringify(errorResponse);
      } catch {
        try {
          errorText = await responseClone.text();
        } catch (textError) {
          errorText = 'Failed to parse error response';
        }
      }
      console.error(`[API] Error ${status}: ${errorText}`); // Логируем ошибки прямо здесь
      return {
        success: false,
        status,
        error: errorText
      };
    }

    try {
      const data: T = await response.json();
      console.log(`[API] Success ${status}: Received data`, data); // Логи принимаемых данных
      return { 
        success: true, 
        status,
        data 
      };
    } catch (parseError) {
      console.error('[API] Failed to parse response:', parseError);
      return {
        success: false,
        status: 500,
        error: 'Failed to parse response data'
      };
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    initData?: string
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData;
    }

    const startTime = Date.now();
    console.log(`[API] ${method} ${url}`, {
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const result = await this.handleResponse<T>(response);
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`[API] Success ${result.status} (${duration}ms):`, result.data);
      } else {
        console.error(`[API] Error ${result.status} (${duration}ms): ${result.error}`);
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[API] Network error (${duration}ms):`, error);

      return {
        success: false,
        status: 0,
        error: error.message || 'Network request failed'
      };
    }
  }

  // Оставшиеся методы остаются такими же, как и были ранее...

  async getSprites(initData?: string): Promise<ApiResponse<Sprite[]>> {
    return this.makeRequest<Sprite[]>('/shop/sprites', 'GET', undefined, initData);
  }

  // Остальные методы остаются прежними...
}

export const api = new Api();
