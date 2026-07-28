import { createApp } from "./app.js";

// Fail loudly at startup rather than on the first request that needs the key.
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set — refusing to start");
}

const PORT = Number(process.env.PORT) || 3001;

createApp().listen(PORT, () => {
  console.log(`calorie-tracker-server listening on :${PORT}`);
});
