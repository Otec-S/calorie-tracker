import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeWithClaude, sendChatMessage, summarizeDay } from "./claude.ts";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Minimal stand-ins for Response — only .ok/.status/.json() are ever read,
// and fetch is mocked, so there's no need to satisfy the full interface.

function response(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

/** An error response whose body isn't JSON (e.g. nginx's HTML 413 page). */
function nonJsonResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON at position 0");
    },
  };
}

describe("analyzeWithClaude", () => {
  it("returns the parsed analysis on success", async () => {
    fetchMock.mockResolvedValue(response(200, { title: "Овсянка", cal_min: 300, cal_max: 350 }));

    await expect(analyzeWithClaude({ text: "овсянка" })).resolves.toMatchObject({ title: "Овсянка" });
  });

  it("posts base64 and text to the proxy endpoint", async () => {
    fetchMock.mockResolvedValue(response(200, {}));
    await analyzeWithClaude({ base64: "AAAA", text: "с молоком" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/analyze");
    expect(JSON.parse(init.body)).toEqual({ base64: "AAAA", text: "с молоком" });
  });

  it("replaces the browser's raw fetch failure with a readable message", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(analyzeWithClaude({ text: "x" })).rejects.toThrow(
      "Не удалось подключиться к серверу, проверь соединение",
    );
  });

  it("surfaces the backend's error message", async () => {
    fetchMock.mockResolvedValue(response(502, { error: "Сервис анализа сейчас перегружен" }));

    await expect(analyzeWithClaude({ text: "x" })).rejects.toThrow("Сервис анализа сейчас перегружен");
  });

  it("falls back to the status code when the error body isn't JSON", async () => {
    // This is what an nginx 413 looks like from the browser's side.
    fetchMock.mockResolvedValue(nonJsonResponse(413));

    await expect(analyzeWithClaude({ text: "x" })).rejects.toThrow("Ошибка запроса: 413");
  });

  it("falls back to the status code when the error message is blank", async () => {
    fetchMock.mockResolvedValue(response(429, { error: "" }));

    await expect(analyzeWithClaude({ text: "x" })).rejects.toThrow("Ошибка запроса: 429");
  });
});

describe("summarizeDay", () => {
  it("returns the parsed summary on success", async () => {
    fetchMock.mockResolvedValue(response(200, { verdict: "ok" }));

    await expect(summarizeDay([], 2300)).resolves.toEqual({ verdict: "ok" });
  });

  it("surfaces the backend's error message", async () => {
    fetchMock.mockResolvedValue(response(502, { error: "Пустой ответ от модели" }));

    await expect(summarizeDay([], 2300)).rejects.toThrow("Пустой ответ от модели");
  });
});

describe("sendChatMessage", () => {
  it("unwraps the reply field", async () => {
    fetchMock.mockResolvedValue(response(200, { reply: "Съешь творог." }));

    await expect(sendChatMessage([], {}, 2300)).resolves.toBe("Съешь творог.");
  });

  it("reports a connection failure in Russian", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(sendChatMessage([], {}, 2300)).rejects.toThrow(
      "Не удалось подключиться к серверу, проверь соединение",
    );
  });
});
