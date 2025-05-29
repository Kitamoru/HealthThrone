export interface Question {
  id: number;
  text: string;
  positive_answer: string;
  negative_answer: string;
  weight: number;
}

export interface UserAnswer {
  question_id: number;
  is_positive: boolean;
  timestamp: string;
}

export interface BurnoutResult {
  level: number;
  timestamp: string;
  answers: UserAnswer[];
}