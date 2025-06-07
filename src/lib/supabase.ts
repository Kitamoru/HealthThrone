import { createClient } from '@supabase/supabase-js';

console.log("[Supabase] Initializing Supabase client");
console.log("[Supabase] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "***" + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(-8) : "MISSING");
console.log("[Supabase] Key:", process.env.NEXT_PUBLIC_SUPABASE_KEY ? "***" + process.env.NEXT_PUBLIC_SUPABASE_KEY.slice(-5) : "MISSING");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
export const setUserContext = async (telegramId: number) => {
  console.log(`[RLS] Setting user context: ${telegramId}`);
  const { error } = await supabase
    .rpc('set_current_user', { user_id: telegramId });
  
  if (error) {
    console.error('[RLS] Error setting user context:', error);
  }
};

export interface UserProfile {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  burnout_level: number;
  last_survey_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  coins: number;
  current_sprite_id?: number;
  last_login_date?: string;
  last_attempt_date?: string;
}

export interface Friend {
  id: number;
  created_at: string;
  friend: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    burnout_level: number;
  };
}

export interface Sprite {
  id: number;
  name: string;
  image_url: string;
  price: number;
  created_at: string;
}

export interface UserSprite {
  id: number;
  user_id: number;
  sprite_id: number;
  purchased_at: string;
}
