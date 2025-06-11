export interface TelegramUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}
// Новый тип для успешного ответа при экипировке спрайта
export type EquipSuccessResponse = {
  success: true;
  currentSprite: number; // полe currentSprite добавляется именно сюда
};

// Тип для ошибки при экипировке
export type EquipFailureResponse = {
  success: false;
  status: number;
  error: string;
};

// Объединённый тип для обоих сценариев
export type EquipResponse = EquipSuccessResponse | EquipFailureResponse;

export interface TelegramContact {
  user_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  newCoins?: T;
  error?: string;
}

export interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price: number;
  created_at?: string;
}

export interface UserProfile {
  id: number;
  telegram_id: number;
  created_at: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  burnout_level: number;
  last_attempt_date?: string | null;
  coins: number;
  updated_at: string;
  current_sprite_id?: number | null;
  last_login_date?: string;
}

export interface Friend {
  id: number;
  created_at: string;
  friend_id: number;
  friend: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    burnout_level: number;
    coins: number;
    updated_at: string;
  };
}

export interface ShopUserProfile {
  id: number;
  coins: number;
  current_sprite_id?: number | null;
}

export interface UserSprite {
  id: number;
  user_id: number;
  sprite_id: number;
  purchased_at: string;
}
