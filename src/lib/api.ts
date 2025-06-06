// Базовый интерфейс для ответов API
interface ApiResponse<T = any> {
  success: boolean;    // Успешно ли выполнен запрос
  data?: T;            // Данные ответа (если есть)
  error?: string;      // Сообщение об ошибке (если запрос не удался)
}

// Интерфейс для спрайтов (аватарок)
export interface Sprite {
  id: number;          // Уникальный ID спрайта
  name: string;        // Название спрайта
  image_url: string;   // URL изображения спрайта
  price?: number;      // Цена спрайта (может быть не определена)
  isEquipped?: boolean;// Надет ли спрайт в данный момент
}

// Класс для работы с AP
class Api {
  private baseUrl = '/api'; // Базовый URL API

  // Вспомогательный метод для формирования заголовков
  private getHeaders(initData?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    return headers;
  }

  // Общий метод для выполнения запросов
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Выполняем fetch-запрос
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Определяем тип контента
      const contentType = response.headers.get('content-type');
      let data;
      
      // Обрабатываем JSON или обычный текст
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Если ответ не успешный
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Что-то пошло не так'
        };
      }

      // Возвращаем успешный ответ
      return {
        success: true,
        data
      };
    } catch (error) {
      // Обработка ошибок сети
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сети';
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
    return this.request(`/data?userId=${userId}`, { 
      headers: this.getHeaders(initData) 
    });
  }

  // Обновление уровня выгорания
  async updateBurnoutLevel(userId: number, level: number, initData?: string) {
    return this.request('/update', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ userId, burnoutLevel: level })
    });
  }

  // Получение списка друзей
  async getFriends(userId: number, initData?: string) {
    return this.request(`/friends?userId=${userId}`, { 
      headers: this.getHeaders(initData) 
    });
  }

  // Добавление друга
  async addFriend(friendUsername: string, initData?: string) {
    return this.request('/friends', {
      method: 'POST',
      headers: this.getHeaders(initData),
      body: JSON.stringify({ friendUsername })
    });
  }

  // Удаление друга
  async deleteFriend(friendId: number, initData?: string) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
      headers: this.getHeaders(initData)
    });
  }

  // Получение всех спрайтов
  async getSprites(): Promise<ApiResponse<Sprite[]>> {
    return this.request('/shop/sprites');
  }
  
  // Получение конкретного спрайта по ID
  async getSprite(spriteId: number): Promise<ApiResponse<Sprite>> {
    return this.request(`/shop/sprites/${spriteId}`);
  }

  // Покупка спрайта
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

  // Обновление даты последней попытки
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

  // Получение купленных спрайтов пользователя
  async getOwnedSprites(
    userId: number, 
    initData?: string
  ): Promise<ApiResponse<Sprite[]>> {
    return this.request(`/shop/owned?userId=${userId}`, {
      headers: this.getHeaders(initData)
    });
  }

  // Установка активного спрайта
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

// Экспортируем экземпляр API
export const api = new Api();
