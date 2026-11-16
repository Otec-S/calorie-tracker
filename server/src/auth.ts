import { createHmac, timingSafeEqual } from "node:crypto";

const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET;

// Extra users: AUTH_USERS="alice:pass1,bob:pass2". Split on the first colon,
// so a password may contain ':' but not ','. Combined with the legacy
// AUTH_USER/AUTH_PASSWORD pair, which keeps working.
export function parseUsers(
  authUsers: string | undefined,
  legacyUser: string | undefined,
  legacyPassword: string | undefined,
): Array<{ user: string; password: string }> {
  const users: Array<{ user: string; password: string }> = [];
  if (legacyUser && legacyPassword) users.push({ user: legacyUser, password: legacyPassword });
  for (const entry of (authUsers ?? "").split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    const user = trimmed.slice(0, idx);
    const password = trimmed.slice(idx + 1);
    if (idx <= 0 || !password) {
      throw new Error("AUTH_USERS entries must look like user:password — refusing to start");
    }
    users.push({ user, password });
  }
  return users;
}

const USERS = parseUsers(process.env.AUTH_USERS, process.env.AUTH_USER, process.env.AUTH_PASSWORD);

if (USERS.length === 0 || !AUTH_COOKIE_SECRET) {
  throw new Error(
    "AUTH_COOKIE_SECRET and at least one user (AUTH_USER/AUTH_PASSWORD or AUTH_USERS) must be set — refusing to start",
  );
}

export const SESSION_COOKIE_NAME = "ct_session";
const SESSION_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year — this is what lets the PWA stay logged in

function sign(expiry: number): string {
  return createHmac("sha256", AUTH_COOKIE_SECRET!).update(String(expiry)).digest("hex");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function checkCredentials(user: string, password: string): boolean {
  // Check every user without early exit so timing doesn't reveal which logins exist.
  let ok = false;
  for (const u of USERS) {
    const userOk = timingSafeEqualStr(user, u.user);
    const passOk = timingSafeEqualStr(password, u.password);
    if (userOk && passOk) ok = true;
  }
  return ok;
}

export function issueSessionCookie(): string {
  const expiry = Date.now() + SESSION_MAX_AGE_MS;
  const token = `${expiry}.${sign(expiry)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function verifySessionCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expiryStr, signature] = match[1].split(".");
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || expiry < Date.now() || !signature) return false;

  const expectedBuf = Buffer.from(sign(expiry), "hex");
  const actualBuf = Buffer.from(signature, "hex");
  return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
}
