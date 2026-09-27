// HMAC-signed session cookie. Web Crypto only so it runs in middleware too.
export const SESSION_COOKIE = "admin96";
export const SESSION_TTL_S = 12 * 60 * 60;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

async function hmac(key: string, data: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

// compare via HMAC so it's constant time and doesn't leak length
export async function safeEqual(a: string, b: string) {
  const k = "cmp";
  const [x, y] = await Promise.all([hmac(k, a), hmac(k, b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export async function createSession(username: string) {
  const s = secret();
  if (!s) throw new Error("ADMIN_SESSION_SECRET missing or shorter than 32 chars");
  const payload = b64url(enc.encode(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S })));
  const sig = b64url(await hmac(s, payload));
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  const s = secret();
  if (!s || !token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = b64url(await hmac(s, payload));
  if (!(await safeEqual(sig, expected))) return false;
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { exp: number };
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function cookieOptions(maxAge = SESSION_TTL_S) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
