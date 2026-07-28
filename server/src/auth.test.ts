import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME, checkCredentials, issueSessionCookie, verifySessionCookie } from "./auth.js";

// Mirrors sign() in auth.ts — lets the tests forge both valid and invalid
// tokens without exporting the signing helper from production code.
function token(expiry: number, secret = "test-cookie-secret"): string {
  return `${expiry}.${createHmac("sha256", secret).update(String(expiry)).digest("hex")}`;
}

function cookie(value: string): string {
  return `${SESSION_COOKIE_NAME}=${value}`;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("checkCredentials", () => {
  it("accepts the configured credentials", () => {
    expect(checkCredentials("tester", "hunter2")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(checkCredentials("tester", "wrong")).toBe(false);
  });

  it("rejects a wrong username", () => {
    expect(checkCredentials("someone", "hunter2")).toBe(false);
  });

  it("rejects empty credentials", () => {
    expect(checkCredentials("", "")).toBe(false);
  });
});

describe("issueSessionCookie", () => {
  it("marks the cookie HttpOnly and SameSite=Lax", () => {
    const header = issueSessionCookie();
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
  });

  it("omits Secure outside production, so http://localhost works in dev", () => {
    expect(issueSessionCookie()).not.toContain("Secure");
  });

  it("issues a cookie that verifies", () => {
    const value = issueSessionCookie().split(";")[0].split("=")[1];
    expect(verifySessionCookie(cookie(value))).toBe(true);
  });
});

describe("verifySessionCookie", () => {
  const future = Date.now() + 60_000;

  it("accepts a correctly signed, unexpired token", () => {
    expect(verifySessionCookie(cookie(token(future)))).toBe(true);
  });

  it("finds its cookie among others", () => {
    expect(verifySessionCookie(`other=1; ${cookie(token(future))}; another=2`)).toBe(true);
  });

  it("rejects a missing Cookie header", () => {
    expect(verifySessionCookie(undefined)).toBe(false);
  });

  it("rejects a header without our cookie", () => {
    expect(verifySessionCookie("other=1; another=2")).toBe(false);
  });

  it("rejects an expired token", () => {
    expect(verifySessionCookie(cookie(token(Date.now() - 1000)))).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    expect(verifySessionCookie(cookie(token(future, "attacker-secret")))).toBe(false);
  });

  it("rejects a token whose expiry was extended without re-signing", () => {
    const signature = token(future).split(".")[1];
    expect(verifySessionCookie(cookie(`${future + 999_999}.${signature}`))).toBe(false);
  });

  it("rejects a non-hex signature", () => {
    // Buffer.from(x, "hex") silently truncates at the first invalid pair, so
    // this could otherwise degenerate into comparing two empty buffers.
    expect(verifySessionCookie(cookie(`${future}.not-hex-at-all`))).toBe(false);
  });

  it("rejects a token with no signature part", () => {
    expect(verifySessionCookie(cookie(String(future)))).toBe(false);
  });

  it("rejects a token with a non-numeric expiry", () => {
    expect(verifySessionCookie(cookie(`soon.${token(future).split(".")[1]}`))).toBe(false);
  });

  it("rejects a cookie that expires while the session is idle", () => {
    vi.useFakeTimers();
    const expiry = Date.now() + 60_000;
    expect(verifySessionCookie(cookie(token(expiry)))).toBe(true);

    vi.advanceTimersByTime(61_000);
    expect(verifySessionCookie(cookie(token(expiry)))).toBe(false);
  });
});
