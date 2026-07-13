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
