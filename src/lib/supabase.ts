import { createClient } from '@supabase/supabase-js';

console.log("[Supabase] Initializing Supabase client");
console.log("[Supabase] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "***" + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(-8) : "MISSING");
console.log("[Supabase] Key:", process.env.NEXT_PUBLIC_SUPABASE_KEY ? "***" + process.env.NEXT_PUBLIC_SUPABASE_KEY.slice(-5) : "MISSING");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
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
}
export interface Friend {
  id: number;
  user_id: number;
  friend_telegram_id: number;
  friend_username: string;
  friend_burnout_level: number;
  created_at: string;
}
