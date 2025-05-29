
import { createClient } from '@supabase/supabase-js';

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
