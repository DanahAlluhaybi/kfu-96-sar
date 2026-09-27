import type { NextRequest } from "next/server";
import { analystEnabled, PULSE_QUESTION, runAnalyst } from "@/lib/analyst";
import { getStore } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { MIN_RESPONSES_FOR_INSIGHT } from "@/lib/insight";
import { getStatRows, json, rateLimit, requireAdmin, sameOrigin } from "@/lib/server";

export const dynamic = "force-dynamic";
// several model calls per request, so give it the full 60s on vercel
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return json({ enabled: analystEnabled(), responses: (await getStatRows(true)).length, minResponses: MIN_RESPONSES_FOR_INSIGHT });
}

// no question = full "student pulse" report
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!analystEnabled()) return json({ error: "ai_disabled" }, 503);
  if (!rateLimit("analyst", 8, 60_000)) return json({ error: "rate_limited" }, 429);

  const body = (await req.json().catch(() => ({}))) as { lang?: unknown; question?: unknown };
  const lang = isLang(body.lang) ? body.lang : "ar";
  const asked = typeof body.question === "string" ? body.question.replace(/[<>]/g, "").trim().slice(0, 400) : "";
  const question = asked || PULSE_QUESTION[lang];

  const n = (await getStatRows(true)).length;
  if (n < MIN_RESPONSES_FOR_INSIGHT) return json({ error: "not_enough_data", minResponses: MIN_RESPONSES_FOR_INSIGHT }, 409);

  try {
    return json(await runAnalyst(getStore(), question, lang));
  } catch (e) {
    console.warn("[96] analyst failed", e);
    return json({ error: "analyst_failed" }, 502);
  }
}
