
export interface User {
  user_id: string;
  username?: string;
  first_name?: string;
  burnout_level: number;
  last_survey_date?: string;
}

export interface Question {
  id: number;
  text: string;
  positive_answer: string;
  negative_answer: string;
}

export interface SurveyAnswer {
  question_id: number;
  answer: boolean; // true for positive, false for negative
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BurnoutUpdateResponse {
  status: string;
  burnout_level?: number;
}
