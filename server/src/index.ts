import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { analyzeWithClaude } from "./claude.js";
import { checkCredentials, issueSessionCookie, verifySessionCookie } from "./auth.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set — refusing to start");
}

const PORT = Number(process.env.PORT) || 3001;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const app = express();
app.set("trust proxy", 1); // behind nginx in production — needed for correct req.ip
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "10mb" })); // resized photos are base64-encoded here

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

app.listen(PORT, () => {
  console.log(`calorie-tracker-server listening on :${PORT}`);
});
