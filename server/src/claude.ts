import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, DaySummary, FoodAnalysis } from "./types.js";

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

const SUMMARY_SYSTEM_PROMPT = `Ты — нутрициолог-аналитик. Тебе дают список всего, что человек съел за день, и его дневную цель по калориям.
Оцени рацион в целом и передай результат через инструмент submit_day_summary: общий вердикт о полезности рациона, гармоничность БЖУ, попадание в цель по калориям и 2-3 конкретные рекомендации на будущее.
Пиши по-русски, коротко и по делу, без нравоучений.`;

const SUMMARY_TOOL: Anthropic.Tool = {
  name: "submit_day_summary",
  description: "Отправить сводный разбор рациона за день.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      verdict: { type: "string", description: "общая оценка полезности рациона за день, 1-2 предложения" },
      macro_balance: { type: "string", description: "оценка гармоничности БЖУ, 1-2 предложения" },
      calorie_target: { type: "string", description: "попадание в дневную цель по калориям, 1 предложение" },
      recommendations: {
        type: "array",
        items: { type: "string" },
        description: "2-3 конкретные рекомендации по питанию на будущее",
      },
    },
    required: ["verdict", "macro_balance", "calorie_target", "recommendations"],
    additionalProperties: false,
  },
};

interface AnalyzeInput {
  base64?: string;
  text?: string;
}

/** One eaten dish as sent by the frontend: analysis fields plus the entry time. */
export interface DayEntry extends FoodAnalysis {
  time?: string;
}

/**
 * Translates a raw APIError (whose .message is the literal wire JSON, e.g.
 * `529 {"type":"error","error":{"type":"overloaded_error",...}}`) into
 * something a phone screen should actually show a person. The SDK already
 * retries transient errors internally (default maxRetries); getting one of
 * these means retries were exhausted.
 */
function toFriendlyError(err: unknown): Error {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 529 || err.type === "overloaded_error") {
      return new Error("Сервис анализа сейчас перегружен, попробуй через минуту");
    }
    if (err.status === 429 || err.type === "rate_limit_error") {
      return new Error("Слишком много запросов к сервису анализа, подожди немного");
    }
    return new Error("Не получилось связаться с сервисом анализа, попробуй ещё раз");
  }
  return err instanceof Error ? err : new Error(String(err));
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
    throw toFriendlyError(err);
  }

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_food_analysis",
  );
  if (!toolUse) throw new Error("Пустой ответ от модели");
  return toolUse.input as FoodAnalysis;
}

/**
 * Sends the whole day's entries to Claude and returns a structured verdict
 * on the diet: overall healthiness, macro balance, calorie-goal fit, and
 * concrete recommendations.
 */
export async function summarizeDayWithClaude(entries: DayEntry[], goal: number): Promise<DaySummary> {
  const lines = entries.map((e) => {
    const cal = e.cal_min === e.cal_max ? `${e.cal_min}` : `${e.cal_min}–${e.cal_max}`;
    const time = e.time ? `${e.time} — ` : "";
    const portion = e.portion ? `, порция: ${e.portion}` : "";
    const note = e.note ? ` (${e.note})` : "";
    return `- ${time}${e.title}: ${cal} ккал, Б ${e.protein_g}г / Ж ${e.fat_g}г / У ${e.carbs_g}г${portion}${note}`;
  });

  const totalMin = entries.reduce((s, e) => s + (e.cal_min || 0), 0);
  const totalMax = entries.reduce((s, e) => s + (e.cal_max || 0), 0);

  const goalLine = goal > 0 ? ` Дневная цель: ${goal} ккал.` : "";
  const text = `Съедено за день:
${lines.join("\n")}

Итого примерно ${totalMin}–${totalMax} ккал.${goalLine}
Оцени рацион за день.`;

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system: SUMMARY_SYSTEM_PROMPT,
      tools: [SUMMARY_TOOL],
      tool_choice: { type: "tool", name: "submit_day_summary" },
      messages: [{ role: "user", content: text }],
    });
  } catch (err) {
    throw toFriendlyError(err);
  }

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_day_summary",
  );
  if (!toolUse) throw new Error("Пустой ответ от модели");
  return toolUse.input as DaySummary;
}

const CHAT_SYSTEM_PROMPT = `Ты — нутрициолог-консультант. Пользователь ведёт дневник питания и задаёт тебе уточняющие вопросы по планированию рациона: что съесть дальше, укладывается ли он в цель по калориям, как сбалансировать БЖУ и т.п.
Пользователь может прикладывать к сообщению фото (например, блюда, состава продукта, результатов анализов) или PDF-документы — учитывай их содержимое в ответе.
Отвечай по-русски, коротко и по делу, как в переписке — без длинных вступлений и нравоучений. Опирайся на данные о питании пользователя, приведённые ниже.`;

/**
 * Converts one stored chat turn into the content shape the Anthropic SDK
 * expects — plain text when there's nothing attached (cheapest, most
 * common case), or an array with image/document blocks ahead of the text
 * block when the user attached files to that turn.
 */
function toApiContent(m: ChatMessage): string | Anthropic.ContentBlockParam[] {
  if (!m.attachments || m.attachments.length === 0) return m.content;

  const blocks: Anthropic.ContentBlockParam[] = m.attachments.map((a) =>
    a.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: a.base64 } }
      : { type: "image", source: { type: "base64", media_type: a.mediaType, data: a.base64 } },
  );
  if (m.content) blocks.push({ type: "text", text: m.content });
  return blocks;
}

/**
 * Renders a user's recent food log (grouped by date) into the plain-text
 * block injected into the chat system prompt, so the model can reason about
 * what was already eaten without a tool round-trip.
 */
function formatDietContext(days: Record<string, DayEntry[]>, goal: number): string {
  const dateKeys = Object.keys(days).sort();
  const dayBlocks = dateKeys.map((dateKey) => {
    const entries = days[dateKey];
    if (!entries || entries.length === 0) return `${dateKey}: ничего не съедено`;
    const lines = entries.map((e) => {
      const cal = e.cal_min === e.cal_max ? `${e.cal_min}` : `${e.cal_min}–${e.cal_max}`;
      const time = e.time ? `${e.time} — ` : "";
      return `  - ${time}${e.title}: ${cal} ккал, Б ${e.protein_g}г / Ж ${e.fat_g}г / У ${e.carbs_g}г`;
    });
    const totalMin = entries.reduce((s, e) => s + (e.cal_min || 0), 0);
    const totalMax = entries.reduce((s, e) => s + (e.cal_max || 0), 0);
    return `${dateKey} (итого ~${totalMin}–${totalMax} ккал):\n${lines.join("\n")}`;
  });

  const goalLine = goal > 0 ? `\n\nДневная цель по калориям: ${goal} ккал.` : "";
  return `Данные о питании пользователя за последние дни:\n\n${dayBlocks.join("\n\n")}${goalLine}`;
}

/**
 * Sends a multi-turn conversation to Claude with the user's recent food log
 * folded into the system prompt (rebuilt fresh on every call, since the log
 * can change mid-conversation). No tool use — this is free-form advice, not
 * a structured record.
 */
export async function chatAboutDietWithClaude(
  messages: ChatMessage[],
  days: Record<string, DayEntry[]>,
  goal: number,
): Promise<string> {
  const system = `${CHAT_SYSTEM_PROMPT}\n\n${formatDietContext(days, goal)}`;

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system,
      messages: messages.map((m) => ({ role: m.role, content: toApiContent(m) })),
    });
  } catch (err) {
    throw toFriendlyError(err);
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Пустой ответ от модели");
  return textBlock.text;
}
