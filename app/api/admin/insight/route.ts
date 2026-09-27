import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { aiEnabled, aiPayloadFor, MIN_RESPONSES_FOR_INSIGHT, regenerateInsight } from "@/lib/insight";
import { getStatRows, json, requireAdmin, sameOrigin } from "@/lib/server";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const stats = computeStats(await getStatRows(true));
  const store = getStore();
  const [ar, en] = await Promise.all([store.latestInsight("ar"), store.latestInsight("en")]);
  return json({
    insights: { ar, en },
    payload: await aiPayloadFor(stats, store),
    aiEnabled: aiEnabled(),
    minResponses: MIN_RESPONSES_FOR_INSIGHT,
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);

  const body = (await req.json().catch(() => ({}))) as { lang?: unknown };
  const lang = isLang(body.lang) ? body.lang : "ar";
  const stats = computeStats(await getStatRows(true));
  if (stats.total < MIN_RESPONSES_FOR_INSIGHT) {
    return json({ error: "not_enough_data", minResponses: MIN_RESPONSES_FOR_INSIGHT }, 409);
  }
  const insight = await regenerateInsight(stats, lang);
  return json({ insight, payload: insight?.payload ?? (await aiPayloadFor(stats)) });
}
