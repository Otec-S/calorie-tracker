import type { FoodAnalysis } from "../types.ts";

export const CHAT_SEED_ENTRIES: FoodAnalysis[] = [
  {
    title: "Капучино",
    items: "эспрессо, молоко, молочная пена",
    portion: "~270 мл",
    cal_min: 80,
    cal_max: 120,
    protein_g: 5,
    fat_g: 5,
    carbs_g: 7,
    note: "Без сахара — лёгкий, некритичный вклад в день.",
  },
  {
    title: "Овсянка с орехами и мёдом",
    items: "овсяные хлопья на воде, молоко, тыквенные семечки, миндаль, мёд",
    portion: "~1 порция",
    cal_min: 310,
    cal_max: 350,
    protein_g: 11,
    fat_g: 17,
    carbs_g: 32,
    note: "Сбалансированный завтрак: медленные углеводы, клетчатка и полезные жиры.",
  },
];
