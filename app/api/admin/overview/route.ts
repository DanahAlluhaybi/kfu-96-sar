import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { aiEnabled } from "@/lib/insight";
import { getStatRows, json, requireAdmin } from "@/lib/server";
import { computeStats, computeTrend, computeWriteInThemes, countToday } from "@/lib/stats";
import type { AdminOverview } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const store = getStore();
  const rows = await getStatRows(true);
  const stats = computeStats(rows);
  const [latest, ar, en, answers] = await Promise.all([
    store.listResponses({ limit: 8 }),
    store.latestInsight("ar"),
    store.latestInsight("en"),
    store.customAnswers(),
  ]);

  const body: AdminOverview = {
    ...stats,
    today: countToday(rows),
    avgPicks: stats.total ? Math.round((stats.selections / stats.total) * 10) / 10 : 0,
    trend: computeTrend(rows),
    latest: latest.rows,
    insights: { ...(ar ? { ar } : {}), ...(en ? { en } : {}) },
    writeIns: { total: answers.length, themes: computeWriteInThemes(answers).slice(0, 30) },
    storage: store.kind,
    aiEnabled: aiEnabled(),
  };
  return json(body);
}
