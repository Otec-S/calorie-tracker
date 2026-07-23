import type { DaySummary, Entry, FoodAnalysis } from "../types.ts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface AnalyzeInput {
  base64?: string;
  text?: string;
}

/**
 * Wraps fetch() so network-level failures (server unreachable, no
 * connection, blocked by CORS) surface as a Russian message instead of the
 * browser's raw "Failed to fetch" TypeError.
 */
async function fetchOrThrow(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error("Не удалось подключиться к серверу, проверь соединение");
  }
}

/**
 * Sends a food photo and/or text description to the backend proxy, which
 * holds the Anthropic API key server-side and forwards the request to
 * Claude. Returns the parsed calorie/macro analysis.
 */
export async function analyzeWithClaude({ base64, text }: AnalyzeInput): Promise<FoodAnalysis> {
  const response = await fetchOrThrow(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, text }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Ошибка запроса: ${response.status}`);
  }

  return (await response.json()) as FoodAnalysis;
}

/**
 * Sends a whole day's entries (plus the calorie goal) to the backend proxy
 * and returns Claude's structured verdict on the day's diet.
 */
export async function summarizeDay(entries: Entry[], goal: number): Promise<DaySummary> {
  const response = await fetchOrThrow(`${API_BASE_URL}/api/summarize-day`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries, goal }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Ошибка запроса: ${response.status}`);
  }

  return (await response.json()) as DaySummary;
}
