import Anthropic from "@anthropic-ai/sdk";
import type { FoodAnalysis } from "./types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
 * parsed calorie/macro analysis. Runs server-side only — this is why the
 * proxy exists: the Anthropic API key never reaches the browser.
 */
export async function analyzeWithClaude({ base64, text }: AnalyzeInput): Promise<FoodAnalysis> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (base64) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
  }
  content.push({
    type: "text",
    text: base64
      ? text
        ? `Дополнительное описание от пользователя к фото: "${text}". Учти его при оценке калорийности.`
        : "Определи, что на фото, и оцени калорийность."
      : `Описание от пользователя: "${text}". Оцени калорийность этого блюда.`,
  });

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    // The SDK already retries transient errors internally (default
    // maxRetries); reaching here means retries were exhausted. Translate
    // the raw APIError (whose .message is the literal wire JSON, e.g.
    // `529 {"type":"error","error":{"type":"overloaded_error",...}}`)
    // into something a phone screen should actually show a person.
    if (err instanceof Anthropic.APIError) {
      if (err.status === 529 || err.type === "overloaded_error") {
        throw new Error("Сервис анализа сейчас перегружен, попробуй через минуту");
      }
      if (err.status === 429 || err.type === "rate_limit_error") {
        throw new Error("Слишком много запросов к сервису анализа, подожди немного");
      }
      throw new Error("Не получилось связаться с сервисом анализа, попробуй ещё раз");
    }
    throw err;
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Пустой ответ от модели");
  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as FoodAnalysis;
}
