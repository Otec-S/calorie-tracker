import { defineConfig } from "vitest/config";

// Deliberately separate from vite.config.ts: the tests only exercise plain .ts
// modules, so there's no reason to spin up the React plugin or the PWA plugin
// (which would generate a service worker on every run).
export default defineConfig({
  test: {
    // node by default — spinning up jsdom for every file cost ~50s per run.
    // The one suite that needs localStorage opts in with a
    // `@vitest-environment jsdom` docblock.
    environment: "node",
    include: ["src/**/*.test.ts"],
    // todayKey()/fmtDate() read the *local* calendar, so an unpinned timezone
    // would make their tests pass or fail depending on the machine.
    env: { TZ: "Europe/Moscow" },
  },
});
