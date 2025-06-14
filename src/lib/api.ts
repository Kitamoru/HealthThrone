import { ApiResponse, UserProfile, Sprite, Friend } from './types';

class Api {
  private baseUrl = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    
    console.log(`[API] Response status: ${response.status}`);
    console.log(`[API] Response body: ${responseText}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorResponse = JSON.parse(responseText);
        errorMessage = errorResponse.error || responseText;
      } catch {
        errorMessage = responseText;
      }
      
      console.error(`[API] Error ${response.status}: ${errorMessage}`);
      return {
        success: false,
        status: response.status,
        error: errorMessage
      };
    }

    try {
      const data: T = JSON.parse(responseText);
      return { 
        success: true, 
        status: response.status,
        data 
      };
    } catch (parseError) {
      console.error('[API] JSON parse error:', parseError, 'Response:', responseText);
      return {
        success: false,
        status: 500,
        error: 'Failed to parse JSON response'
      };
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    initData?: string
  ): Promise<ApiResponse<T>> {
    // Добавляем временную метку для предотвращения кеширования
    const timestamp = Date.now();
    const urlParam = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${urlParam}_t=${timestamp}`;
    
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData;
    }

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

      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('[API] Network error:', error);
      return {
        success: false,
        status: 0,
        error: error.message || 'Network request failed'
      };
    }
  }

  // Обновленные методы
  async getSprites(initData?: string): Promise<ApiResponse<Sprite[]>> {
    if (!initData) {
      console.error('[API] Missing initData in getSprites');
      return {
        success: false,
        error: 'Missing required parameter: initData'
      };
    }
    return this.makeRequest<Sprite[]>('/sprites', 'GET', undefined, initData);
  }

  async getUserData(
  telegramId: number,
  initData?: string
): Promise<ApiResponse<UserProfile>> {
  return this.makeRequest<UserProfile>(
    `/data?telegramId=${telegramId}`, 
    'GET', 
    undefined, 
    initData
  );
}

  async getOwnedSprites(
    telegramId: number
  ): Promise<ApiResponse<number[]>> {
    return this.makeRequest<number[]>(
      `/shop/owned?telegramId=${telegramId}`, 
      'GET'
    );
  }

  async equipSprite(
    telegramId: number, 
    spriteId: number, 
    initData?: string
  ): Promise<ApiResponse> {
    return this.makeRequest(
      '/equip', 
      'POST', 
      { telegramId, spriteId },
      initData
    );
  }
  
  // Survey methods
  async submitSurvey(params: {
    telegramId: number;
    newScore: number;
    initData?: string;
  }): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(
      '/updateBurnout', 
      'POST', 
      {
        telegramId: params.telegramId,
        newScore: params.newScore
      },
      params.initData
    );
  }
}

export const api = new Api();
