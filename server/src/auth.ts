import { createHmac, timingSafeEqual } from "node:crypto";

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET;

if (!AUTH_USER || !AUTH_PASSWORD || !AUTH_COOKIE_SECRET) {
  throw new Error("AUTH_USER, AUTH_PASSWORD and AUTH_COOKIE_SECRET must be set — refusing to start");
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
  return timingSafeEqualStr(user, AUTH_USER!) && timingSafeEqualStr(password, AUTH_PASSWORD!);
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
