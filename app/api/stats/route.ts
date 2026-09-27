import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { getInsightForPublic } from "@/lib/insight";
import { isSafeForAi } from "@/lib/sanitize";
import { getStatRows, json } from "@/lib/server";
import { computeStats, computeWriteInThemes, MIN_THEME_MENTIONS } from "@/lib/stats";

export const dynamic = "force-dynamic";

// public endpoint: percentages + insight only, never raw rows or anyone's free text
export async function GET(req: NextRequest) {
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = isLang(langParam) ? langParam : "ar";
  try {
    const store = getStore();
    const [rows, answers] = await Promise.all([getStatRows(), store.customAnswers().catch(() => [])]);
    const stats = computeStats(rows);
    const insight = await getInsightForPublic(stats, lang).catch(() => null);
    const themes = computeWriteInThemes(answers)
      .filter((t) => t.mentions >= MIN_THEME_MENTIONS && isSafeForAi(t.key) && t.answer.length <= 30)
      .slice(0, 3)
      .map((t) => t.answer);
    return json({
      stats,
      outside: { any: answers.length > 0, themes },
      insight: insight ? { text: insight.text, lang: insight.lang, at: insight.created_at } : null,
    });
  } catch (e) {
    console.error("[96] stats failed", e);
    return json({ error: "server_error" }, 500);
  }
}
