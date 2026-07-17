import Anthropic from "@anthropic-ai/sdk";
import type { FoodAnalysis } from "./types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Ты — нутрициолог-аналитик. По фото еды (или по текстовому описанию) оцени состав и калорийность и передай результат через инструмент submit_food_analysis.
Если на фото нет еды или её невозможно определить — передай title: "Не удалось распознать" и cal_min/cal_max: 0.
Числа — целые, без единиц измерения.`;

const ANALYZE_TOOL: Anthropic.Tool = {
  name: "submit_food_analysis",
  description: "Отправить результат анализа калорийности и БЖУ блюда.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "короткое название блюда по-русски (3-6 слов)" },
      items: { type: "string", description: "краткий список того, что видно на фото, через запятую, по-русски" },
      portion: { type: "string", description: "оценка размера порции (например '~250 г' или '1 средняя тарелка')" },
      cal_min: { type: "integer" },
      cal_max: { type: "integer" },
      protein_g: { type: "integer" },
      fat_g: { type: "integer" },
      carbs_g: { type: "integer" },
      note: { type: "string", description: "одно короткое предложение по-русски о пользе/минусах блюда" },
    },
    required: ["title", "items", "portion", "cal_min", "cal_max", "protein_g", "fat_g", "carbs_g", "note"],
    additionalProperties: false,
  },
};

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
      tools: [ANALYZE_TOOL],
      tool_choice: { type: "tool", name: "submit_food_analysis" },
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

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_food_analysis",
  );
  if (!toolUse) throw new Error("Пустой ответ от модели");
  return toolUse.input as FoodAnalysis;
}
