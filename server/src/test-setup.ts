// Fake credentials so the import-time guards in auth.ts / index.ts pass.
// Nothing here ever reaches a real service — the Anthropic SDK is mocked in
// the tests that would otherwise call it.
process.env.ANTHROPIC_API_KEY = "test-key";
process.env.AUTH_USER = "tester";
process.env.AUTH_PASSWORD = "hunter2";
process.env.AUTH_COOKIE_SECRET = "test-cookie-secret";
