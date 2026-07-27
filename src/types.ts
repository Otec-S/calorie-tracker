export interface FoodAnalysis {
  title: string;
  items: string;
  portion: string;
  cal_min: number;
  cal_max: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  note: string;
}

export interface Entry extends FoodAnalysis {
  id: string;
  time: string;
}

export type Status = "idle" | "analyzing" | "error";

// Kept in sync with server/src/types.ts (separate TS projects).
export interface DaySummary {
  verdict: string; // общая оценка полезности рациона
  macro_balance: string; // гармоничность БЖУ
  calorie_target: string; // попадание в цель по калориям
  recommendations: string[]; // рекомендации на будущее
}

// Kept in sync with server/src/types.ts (separate TS projects).
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
