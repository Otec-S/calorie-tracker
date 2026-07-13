import Anthropic from "@anthropic-ai/sdk";
import type { FoodAnalysis } from "../types.ts";

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `Ты — нутрициолог-аналитик. По фото еды (или по текстовому описанию) оцени состав и калорийность.
Отвечай СТРОГО одним JSON-объектом, без markdown-разметки, без пояснений до или после. Формат:
{
  "title": "короткое название блюда по-русски (3-6 слов)",
  "items": "краткий список того, что видно на фото, через запятую, по-русски",
  "portion": "оценка размера порции (например '~250 г' или '1 средняя тарелка')",
  "cal_min": число,
  "cal_max": число,
  "protein_g": число,
  "fat_g": число,
  "carbs_g": число,
  "note": "одно короткое предложение по-русски о пользе/минусах блюда"
}
Если на фото нет еды или её невозможно определить — верни title: "Не удалось распознать" и cal_min/cal_max: 0.
Числа — целые, без единиц измерения внутри числовых полей.`;

interface AnalyzeInput {
  base64?: string;
  text?: string;
}

/**
 * Sends a food photo and/or text description to Claude and returns the
 * parsed calorie/macro analysis.
 */
export async function analyzeWithClaude({ base64, text }: AnalyzeInput): Promise<FoodAnalysis> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (base64) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
  }
  content.push({
    type: "text",
    text: text
      ? `Описание от пользователя: "${text}". Оцени калорийность этого блюда.`
      : "Определи, что на фото, и оцени калорийность.",
  });

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Пустой ответ от модели");
  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as FoodAnalysis;
}
