import { createClient } from '@supabase/supabase-js';
import { UserProfile, Friend, Sprite, UserSprite } from './types';

console.log("[Supabase] Initializing Supabase client");
console.log("[Supabase] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "***" + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(-8) : "MISSING");
console.log("[Supabase] Key:", process.env.NEXT_PUBLIC_SUPABASE_KEY ? "***" + process.env.NEXT_PUBLIC_SUPABASE_KEY.slice(-5) : "MISSING");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Устанавливает контекст пользователя для RLS (Row Level Security)
 * @param telegramId Telegram ID пользователя
 */
export const setUserContext = async (telegramId: number): Promise<void> => {
  console.log(`[RLS] Setting user context: ${telegramId}`);
  
  try {
    const { error } = await supabase
      .rpc('set_current_user', { user_id: telegramId.toString() });
    
    if (error) {
      throw new Error(`RLS error: ${error.message}`);
    }
  } catch (error) {
    console.error('[RLS] Error setting user context:', error);
    throw error;
  }
};
