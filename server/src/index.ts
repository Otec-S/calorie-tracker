import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { analyzeWithClaude } from "./claude.js";

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
