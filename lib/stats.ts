import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "./categories";
import type { CustomAnswerRow, StatRow } from "./db";
import { isSafeForAi } from "./sanitize";
import { sortStats, type NdStat } from "./nd";
import type { AiPayload, CategoryStat, PublicStats, TrendPoint, WriteInTheme } from "./types";

// a write-in has to show up this many times before the AI sees it
export const MIN_THEME_MENTIONS = 3;

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, no DST

// whole-number percentages that always sum to 100 (largest remainder)
export function roundTo100(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) return values.map(() => 0);
  const raw = values.map((v) => (v / sum) * 100);
  const floored = raw.map(Math.floor);
  let rest = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((a, b) => b.r - a.r || values[b.i] - values[a.i]);
  for (const { i } of order) {
    if (rest <= 0) break;
    floored[i] += 1;
    rest -= 1;
  }
  return floored;
}

export function computeStats(rows: StatRow[]): PublicStats {
  const counts = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<CategoryKey, number>;
  let selections = 0;
  for (const r of rows) {
    for (const c of new Set(r.categories)) {
      if (c in counts) {
        counts[c] += 1;
        selections += 1;
      }
    }
  }
  const total = rows.length;
  const shares = roundTo100(CATEGORY_KEYS.map((k) => counts[k]));
  const categories: CategoryStat[] = CATEGORY_KEYS.map((key, i) => ({
    key,
    count: counts[key],
    share: shares[i],
    reach: total ? Math.round((counts[key] / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count || CATEGORY_KEYS.indexOf(a.key) - CATEGORY_KEYS.indexOf(b.key));

  return {
    total,
    selections,
    categories,
    top: total && categories[0].count > 0 ? categories[0].key : null,
    updatedAt: new Date().toISOString(),
  };
}

export function riyadhDayKey(d: Date) {
  return new Date(d.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
}

export function countToday(rows: StatRow[], now = new Date()) {
  const today = riyadhDayKey(now);
  return rows.filter((r) => riyadhDayKey(new Date(r.created_at)) === today).length;
}

export function computeTrend(rows: StatRow[], now = new Date()): { granularity: "hour" | "day"; points: TrendPoint[] } {
  if (rows.length === 0) return { granularity: "hour", points: [] };
  const times = rows.map((r) => new Date(r.created_at).getTime()).sort((a, b) => a - b);
  const first = times[0];
  const span = now.getTime() - first;
  const hourly = span <= 48 * 3600_000;
  const step = hourly ? 3600_000 : 24 * 3600_000;

  const floorLocal = (t: number) => Math.floor((t + RIYADH_OFFSET_MS) / step) * step - RIYADH_OFFSET_MS;
  let start = floorLocal(first);
  const end = floorLocal(now.getTime());
  const maxBuckets = hourly ? 48 : 60;
  if ((end - start) / step + 1 > maxBuckets) start = end - (maxBuckets - 1) * step;

  const points: TrendPoint[] = [];
  const idx = new Map<number, number>();
  for (let t = start; t <= end; t += step) {
    const local = new Date(t + RIYADH_OFFSET_MS);
    const label = hourly
      ? `${String(local.getUTCHours()).padStart(2, "0")}:00`
      : `${local.getUTCDate()}/${local.getUTCMonth() + 1}`;
    idx.set(t, points.length);
    points.push({ t: new Date(t).toISOString(), label, count: 0 });
  }
  for (const t of times) {
    const i = idx.get(floorLocal(t));
    if (i !== undefined) points[i].count += 1;
  }
  return { granularity: hourly ? "hour" : "day", points };
}

// drop "ال" so القهوه and قهوه group together
export function themeKey(normalized: string) {
  return normalized
    .split(" ")
    .map((w) => (w.length > 3 && w.startsWith("ال") ? w.slice(2) : w))
    .join(" ");
}

export function computeWriteInThemes(rows: CustomAnswerRow[]): WriteInTheme[] {
  const groups = new Map<string, { variants: Map<string, number>; mentions: number; lastAt: string }>();
  for (const r of rows) {
    const key = themeKey(r.normalized);
    if (!key) continue;
    const g = groups.get(key) ?? { variants: new Map(), mentions: 0, lastAt: r.created_at };
    g.mentions += 1;
    g.variants.set(r.text, (g.variants.get(r.text) ?? 0) + 1);
    if (r.created_at > g.lastAt) g.lastAt = r.created_at;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      answer: [...g.variants.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0],
      mentions: g.mentions,
      lastAt: g.lastAt,
    }))
    .sort((a, b) => b.mentions - a.mentions || (a.lastAt < b.lastAt ? 1 : -1));
}

// this is everything the model gets to see
export function buildAiPayload(s: PublicStats, themes: WriteInTheme[] = [], writeInTotal = 0, nd: NdStat[] = []): AiPayload {
  const exp = s.categories.filter((c) => CATEGORIES[c.key].kind === "experience").reduce((a, c) => a + c.count, 0);
  const thing = s.categories.filter((c) => CATEGORIES[c.key].kind === "thing").reduce((a, c) => a + c.count, 0);
  const [ePct, tPct] = exp + thing ? roundTo100([exp, thing]) : [0, 0];
  return {
    event: "Saudi National Day 96 booth — visitors imagine spending 96 SAR",
    budget_sar: 96,
    total_responses: s.total,
    total_picks: s.selections,
    avg_picks_per_response: s.total ? Math.round((s.selections / s.total) * 10) / 10 : 0,
    categories: s.categories
      .filter((c) => c.count > 0)
      .map((c) => ({
        category: CATEGORIES[c.key].label.en,
        picks: c.count,
        share_of_picks_pct: c.share,
        share_of_people_pct: c.reach,
      })),
    top_category: s.top ? CATEGORIES[s.top].label.en : null,
    experiences_vs_things: { experiences_pct: ePct, things_pct: tPct },
    write_in_total: writeInTotal,
    write_in_themes: themes
      .filter((t) => t.mentions >= MIN_THEME_MENTIONS && isSafeForAi(t.key))
      .slice(0, 5)
      .map((t) => ({ answer: t.answer, mentions: t.mentions })),
    official_national_day_context: pickOfficialContext(s, nd),
  };
}

export function pickOfficialContext(s: PublicStats, nd: NdStat[]) {
  const active = sortStats(nd.filter((x) => x.status === "active"));
  const topKeys = s.categories.filter((c) => c.count > 0).slice(0, 2).map((c) => c.key);
  const chosen: NdStat[] = [];
  for (const k of topKeys) {
    const hit = active.find((x) => x.categories.includes(k) && !chosen.includes(x));
    if (hit) chosen.push(hit);
  }
  for (const x of active) if (chosen.length < 5 && !chosen.includes(x) && x.national_day_specific) chosen.push(x);
  return chosen.slice(0, 5).map((x) => ({
    id: x.id,
    related_campaign_categories: x.categories.map((k) => CATEGORIES[k].label.en),
    stat_en: x.stat.en,
    stat_ar: x.stat.ar,
    value_en: x.display.en,
    value_ar: x.display.ar,
    change_vs_previous_period_pct: x.change_pct,
    period_en: x.period_label.en,
    period_ar: x.period_label.ar,
    period_type: x.period_type,
    national_day_specific: x.national_day_specific,
    source: x.source_org.en,
    connect_ar: x.insight_line?.ar ?? null,
    connect_en: x.insight_line?.en ?? null,
  }));
}

// tiny cache so a room full of phones doesn't hammer the db
const g = globalThis as unknown as { __stats96?: { at: number; rows: StatRow[] } };
export function getCachedRows(): StatRow[] | null {
  const c = g.__stats96;
  return c && Date.now() - c.at < 3000 ? c.rows : null;
}
export function setCachedRows(rows: StatRow[]) {
  g.__stats96 = { at: Date.now(), rows };
}
export function invalidateRows() {
  g.__stats96 = undefined;
}
