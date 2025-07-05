Types.ts
export interface TelegramUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

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
  current_sprite_url: string | null;
  character_class: string | null;
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

export interface Question {
  id: number;
  text: string;
  weight: number;
}

export interface UserSprite {
  id: number;
  user_id: number;
  sprite_id: number;
  purchased_at: string;
}

export interface UpdateClassRequest {
  telegramId: number;
  characterClass: string;
  initData?: string;
}

export type OctalysisFactors = [number, number, number, number, number, number, number, number];
