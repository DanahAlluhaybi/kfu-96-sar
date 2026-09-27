import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./auth";
import { getStore, type StatRow } from "./db";
import { getCachedRows, setCachedRows } from "./stats";

export async function getStatRows(fresh = false): Promise<StatRow[]> {
  if (!fresh) {
    const c = getCachedRows();
    if (c) return c;
  }
  const rows = await getStore().statRows();
  setCachedRows(rows);
  return rows;
}

export function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

// per-instance fixed window, fine for a booth
const g = globalThis as unknown as { __rl96?: Map<string, { n: number; reset: number }> };
const buckets = (g.__rl96 ??= new Map());
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

// middleware already checks this, but double-check in every admin route
export async function requireAdmin(req: NextRequest) {
  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  return ok ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // some browsers omit it on same-origin requests
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}
