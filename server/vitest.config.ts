import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // auth.ts and index.ts both throw at import time when their env vars are
    // missing, so the fake values have to be in place before any test imports.
    setupFiles: ["src/test-setup.ts"],
  },
});
