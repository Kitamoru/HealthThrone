
export interface Question {
  id: number;
  text: string;
  positive_answer: string;
  negative_answer: string;
}

export interface UserData {
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

export interface SurveyResponse {
  question_id: number;
  is_positive: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
}
