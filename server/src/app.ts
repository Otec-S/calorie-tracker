import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { analyzeWithClaude, chatAboutDietWithClaude, summarizeDayWithClaude } from "./claude.js";
import { checkCredentials, issueSessionCookie, verifySessionCookie } from "./auth.js";

/**
 * Builds the express app. Kept separate from index.ts (which owns the port
 * binding) so tests can drive the routes with supertest without listening.
 *
 * The rate limiters are created per call rather than at module scope: their
 * counters live in memory, and module-scope singletons would leak state
 * between test files until requests started coming back 429.
 */
export function createApp(): express.Express {
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  const app = express();
  app.set("trust proxy", 1); // behind nginx in production — needed for correct req.ip
  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json({ limit: "25mb" })); // resized photos / chat attachments are base64-encoded here

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Backs nginx's `auth_request` directive — checked on every request to the
  // site, so it must stay cheap (no I/O, just an HMAC check).
  app.get("/api/auth-check", (req, res) => {
    res.sendStatus(verifySessionCookie(req.headers.cookie) ? 200 : 401);
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много попыток входа, попробуй позже" },
  });

  app.post("/api/login", loginLimiter, (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string" || !checkCredentials(username, password)) {
      res.status(401).json({ error: "Неверный логин или пароль" });
      return;
    }
    res.setHeader("Set-Cookie", issueSessionCookie());
    res.json({ ok: true });
  });

  // Each request costs real Anthropic API usage — cap it per IP so a leaked
  // URL or a stray bot can't run up the bill. This is a personal single-user
  // app, so a generous hourly cap is plenty.
  const analyzeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов, попробуй позже" },
  });

  app.post("/api/analyze", analyzeLimiter, async (req, res) => {
    const { base64, text } = req.body ?? {};

    if (typeof base64 !== "string" && typeof text !== "string") {
      res.status(400).json({ error: "Provide either base64 or text" });
      return;
    }

    try {
      const analysis = await analyzeWithClaude({ base64, text });
      res.json(analysis);
    } catch (err) {
      console.error("analyze failed:", err);
      res.status(502).json({ error: err instanceof Error ? err.message : "Analysis failed" });
    }
  });

  // Separate bucket from analyzeLimiter: a day summary is a bigger prompt, and
  // sharing the 20/hour budget would let summaries starve photo analyses.
  const summaryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов, попробуй позже" },
  });

  app.post("/api/summarize-day", summaryLimiter, async (req, res) => {
    const { entries, goal } = req.body ?? {};

    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: "Provide a non-empty entries array" });
      return;
    }

    try {
      const summary = await summarizeDayWithClaude(entries, typeof goal === "number" ? goal : 0);
      res.json(summary);
    } catch (err) {
      console.error("summarize-day failed:", err);
      res.status(502).json({ error: err instanceof Error ? err.message : "Summary failed" });
    }
  });

  // Separate bucket from analyze/summarize: a chat session can involve several
  // back-and-forth turns, so it gets its own budget rather than starving them.
  const chatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов, попробуй позже" },
  });

  app.post("/api/diet-chat", chatLimiter, async (req, res) => {
    const { messages, days, goal } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Provide a non-empty messages array" });
      return;
    }
    if (typeof days !== "object" || days === null) {
      res.status(400).json({ error: "Provide days" });
      return;
    }

    try {
      const reply = await chatAboutDietWithClaude(messages, days, typeof goal === "number" ? goal : 0);
      res.json({ reply });
    } catch (err) {
      console.error("diet-chat failed:", err);
      res.status(502).json({ error: err instanceof Error ? err.message : "Chat failed" });
    }
  });

  return app;
}
