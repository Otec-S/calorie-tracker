import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Every route that reaches Claude is stubbed — these tests are about the
// routing, validation and error mapping in app.ts, not about the model.
vi.mock("./claude.js", () => ({
  analyzeWithClaude: vi.fn(),
  summarizeDayWithClaude: vi.fn(),
  chatAboutDietWithClaude: vi.fn(),
}));

import { createApp } from "./app.js";
import { analyzeWithClaude, chatAboutDietWithClaude, summarizeDayWithClaude } from "./claude.js";

const analyzeMock = vi.mocked(analyzeWithClaude);
const summarizeMock = vi.mocked(summarizeDayWithClaude);
const chatMock = vi.mocked(chatAboutDietWithClaude);

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  // The routes log every failure; keep the test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/health", () => {
  it("reports ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/auth-check", () => {
  it("rejects a request with no session cookie", async () => {
    await request(app).get("/api/auth-check").expect(401);
  });

  it("accepts a request carrying a cookie issued by /api/login", async () => {
    const login = await request(app).post("/api/login").send({ username: "tester", password: "hunter2" });
    const cookie = login.headers["set-cookie"];

    await request(app).get("/api/auth-check").set("Cookie", cookie).expect(200);
  });
});

describe("POST /api/login", () => {
  it("rejects wrong credentials without setting a cookie", async () => {
    const res = await request(app).post("/api/login").send({ username: "tester", password: "nope" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Неверный логин или пароль");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects a non-string password without crashing", async () => {
    await request(app).post("/api/login").send({ username: "tester", password: { $ne: null } }).expect(401);
  });

  it("rejects an empty body", async () => {
    await request(app).post("/api/login").send({}).expect(401);
  });
});

describe("POST /api/analyze", () => {
  it("rejects a body with neither base64 nor text", async () => {
    const res = await request(app).post("/api/analyze").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Provide either base64 or text");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("rejects a body whose fields are the wrong type", async () => {
    await request(app).post("/api/analyze").send({ base64: 42, text: null }).expect(400);
  });

  it("accepts a text-only request", async () => {
    analyzeMock.mockResolvedValue({ title: "Овсянка" } as never);

    const res = await request(app).post("/api/analyze").send({ text: "овсянка" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ title: "Овсянка" });
    expect(analyzeMock).toHaveBeenCalledWith({ base64: undefined, text: "овсянка" });
  });

  it("accepts a photo-only request", async () => {
    analyzeMock.mockResolvedValue({ title: "Салат" } as never);
    await request(app).post("/api/analyze").send({ base64: "AAAA" }).expect(200);
  });

  it("maps an upstream failure to 502 with the friendly message", async () => {
    analyzeMock.mockRejectedValue(new Error("Сервис анализа сейчас перегружен, попробуй через минуту"));

    const res = await request(app).post("/api/analyze").send({ text: "овсянка" });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Сервис анализа сейчас перегружен, попробуй через минуту");
  });
});

describe("POST /api/summarize-day", () => {
  it("rejects a missing entries array", async () => {
    const res = await request(app).post("/api/summarize-day").send({ goal: 2300 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Provide a non-empty entries array");
  });

  it("rejects an empty entries array", async () => {
    await request(app).post("/api/summarize-day").send({ entries: [], goal: 2300 }).expect(400);
  });

  it("rejects entries that aren't an array", async () => {
    await request(app).post("/api/summarize-day").send({ entries: "овсянка" }).expect(400);
  });

  it("summarises a day and passes the goal through", async () => {
    summarizeMock.mockResolvedValue({ verdict: "Норм" } as never);

    const res = await request(app)
      .post("/api/summarize-day")
      .send({ entries: [{ title: "Овсянка" }], goal: 2300 });

    expect(res.status).toBe(200);
    expect(summarizeMock).toHaveBeenCalledWith([{ title: "Овсянка" }], 2300);
  });

  it("substitutes 0 for a non-numeric goal", async () => {
    summarizeMock.mockResolvedValue({ verdict: "Норм" } as never);

    await request(app).post("/api/summarize-day").send({ entries: [{ title: "X" }], goal: "много" });

    expect(summarizeMock).toHaveBeenCalledWith(expect.anything(), 0);
  });

  it("maps an upstream failure to 502", async () => {
    summarizeMock.mockRejectedValue(new Error("Пустой ответ от модели"));

    const res = await request(app).post("/api/summarize-day").send({ entries: [{ title: "X" }] });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Пустой ответ от модели");
  });
});

describe("POST /api/diet-chat", () => {
  it("rejects an empty messages array", async () => {
    const res = await request(app).post("/api/diet-chat").send({ messages: [], days: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Provide a non-empty messages array");
  });

  it("rejects a missing days map", async () => {
    const res = await request(app)
      .post("/api/diet-chat")
      .send({ messages: [{ role: "user", content: "привет" }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Provide days");
  });

  it("rejects a null days map", async () => {
    await request(app)
      .post("/api/diet-chat")
      .send({ messages: [{ role: "user", content: "привет" }], days: null })
      .expect(400);
  });

  it("returns the reply wrapped in an object", async () => {
    chatMock.mockResolvedValue("Съешь творог.");

    const res = await request(app)
      .post("/api/diet-chat")
      .send({ messages: [{ role: "user", content: "что съесть?" }], days: {}, goal: 2300 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: "Съешь творог." });
  });

  it("maps an upstream failure to 502", async () => {
    chatMock.mockRejectedValue(new Error("Слишком много запросов к сервису анализа, подожди немного"));

    const res = await request(app)
      .post("/api/diet-chat")
      .send({ messages: [{ role: "user", content: "x" }], days: {} });

    expect(res.status).toBe(502);
  });
});
