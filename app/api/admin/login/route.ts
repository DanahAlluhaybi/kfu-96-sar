import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, cookieOptions, createSession, safeEqual, SESSION_COOKIE } from "@/lib/auth";
import { clientIp, json, rateLimit, sameOrigin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!rateLimit(`login:${clientIp(req)}`, 5, 60_000)) return json({ error: "rate_limited" }, 429);
  if (!authConfigured()) return json({ error: "not_configured" }, 503);

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const username = typeof body.username === "string" ? body.username.slice(0, 100) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";

  const [userOk, passOk] = await Promise.all([
    safeEqual(username, process.env.ADMIN_USERNAME || "admin"),
    safeEqual(password, process.env.ADMIN_PASSWORD || ""),
  ]);
  if (!userOk || !passOk) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: "invalid_credentials" }, 401);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(username), cookieOptions());
  return res;
}
