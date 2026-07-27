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

// Kept in sync with src/types.ts on the frontend (separate TS projects).
export interface DaySummary {
  verdict: string; // общая оценка полезности рациона
  macro_balance: string; // гармоничность БЖУ
  calorie_target: string; // попадание в цель по калориям
  recommendations: string[]; // рекомендации на будущее
}

// Kept in sync with src/types.ts on the frontend (separate TS projects).
export interface ChatAttachment {
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";
  base64: string; // no data: URL prefix
  name: string;
}

// Kept in sync with src/types.ts on the frontend (separate TS projects).
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
}
