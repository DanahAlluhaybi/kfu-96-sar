// Official national day figures. Kept completely separate from the booth answers.
import seed from "../data/national-day-stats.json";
import { CATEGORY_KEYS, isCategoryKey, type CategoryKey } from "./categories";
import type { Store } from "./db";

type L = { ar: string; en: string };

export const PERIOD_TYPES = [
  "national_day",
  "national_day_week", // week that contains 23 sep
  "pre_national_day_week",
  "post_national_day_week",
  "september",
  "quarter",
] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export type NdStat = {
  id: string;
  status: "active" | "reference";
  priority: number;
  categories: CategoryKey[];
  national_day_specific: boolean;
  period_type: PeriodType;
  period_start: string; // YYYY-MM-DD
  period_end: string;
  period_label: L;
  stat: L;
  value: number;
  unit: "SAR" | "count" | "percent";
  display: L;
  change_pct: number | null;
  change_label: L | null;
  source_org: L;
  source_url: string;
  source_note?: L | null;
  connect?: L | null;
  // "{to}" gets replaced with the top pick
  insight_line?: L | null;
  verified_via?: string[];
  published_at: string; // YYYY-MM-DD
};

// lower = closer to national day
const CLOSENESS: Record<PeriodType, number> = {
  national_day: 0,
  national_day_week: 1,
  pre_national_day_week: 2,
  post_national_day_week: 2,
  september: 3,
  quarter: 4,
};

export function sortStats(list: NdStat[]) {
  return list
    .slice()
    .sort(
      (a, b) =>
        CLOSENESS[a.period_type] - CLOSENESS[b.period_type] ||
        b.period_end.localeCompare(a.period_end) ||
        a.priority - b.priority,
    );
}

export const SEED_STATS = (seed as unknown as { stats: NdStat[] }).stats;

export function statsFor(all: NdStat[], k: CategoryKey) {
  return sortStats(all.filter((s) => s.status === "active" && s.categories.includes(k)));
}

const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, max) : "");
function lbl(v: unknown, max = 300): L | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ar = str(o.ar, max);
  const en = str(o.en, max);
  return ar && en ? { ar, en } : null;
}
function url(v: unknown) {
  const s = str(v, 600);
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function validateNdStat(input: unknown): { ok: true; value: NdStat } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "invalid" };
  const o = input as Record<string, unknown>;
  const id = str(o.id, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!id) return { ok: false, error: "id" };
  const categories = Array.isArray(o.categories) ? CATEGORY_KEYS.filter((k) => (o.categories as unknown[]).includes(k)) : [];
  if (!categories.length || !(o.categories as unknown[]).every(isCategoryKey)) return { ok: false, error: "categories" };
  if (!PERIOD_TYPES.includes(o.period_type as PeriodType)) return { ok: false, error: "period_type" };
  if (!isDate(o.period_start) || !isDate(o.period_end) || !isDate(o.published_at)) return { ok: false, error: "dates" };
  const value = Number(o.value);
  if (!Number.isFinite(value)) return { ok: false, error: "value" };
  const unit = o.unit === "SAR" || o.unit === "count" || o.unit === "percent" ? o.unit : null;
  if (!unit) return { ok: false, error: "unit" };
  const period_label = lbl(o.period_label);
  const stat = lbl(o.stat);
  const display = lbl(o.display, 40);
  const source_org = lbl(o.source_org, 120);
  const source_url = url(o.source_url);
  if (!period_label || !stat || !display || !source_org) return { ok: false, error: "labels" };
  if (!source_url) return { ok: false, error: "source_url" };
  const change = o.change_pct === null || o.change_pct === "" || o.change_pct === undefined ? null : Number(o.change_pct);
  if (change !== null && !Number.isFinite(change)) return { ok: false, error: "change_pct" };
  const ndSpecific = o.national_day_specific === true;
  // only figures the source itself ties to national day can be flagged as such
  if (ndSpecific && o.period_type !== "national_day") return { ok: false, error: "nd_specific_requires_national_day_period" };

  return {
    ok: true,
    value: {
      id,
      status: o.status === "reference" ? "reference" : "active",
      priority: Math.min(Math.max(Number(o.priority) || 5, 1), 99),
      categories,
      national_day_specific: ndSpecific,
      period_type: o.period_type as PeriodType,
      period_start: o.period_start as string,
      period_end: o.period_end as string,
      period_label,
      stat,
      value,
      unit,
      display,
      change_pct: change,
      change_label: change === null ? null : lbl(o.change_label) ?? { ar: "مقارنة بالفترة السابقة", en: "vs the previous period" },
      source_org,
      source_url,
      source_note: lbl(o.source_note),
      connect: lbl(o.connect),
      insight_line: lbl(o.insight_line),
      verified_via: Array.isArray(o.verified_via) ? (o.verified_via.map(url).filter(Boolean) as string[]).slice(0, 5) : [],
      published_at: o.published_at as string,
    },
  };
}

export async function loadNdStats(store: Store): Promise<NdStat[]> {
  try {
    const rows = await store.ndStats();
    return rows.length ? rows : SEED_STATS;
  } catch (e) {
    console.warn("[96] nd_stats unavailable, using seed", e);
    return SEED_STATS;
  }
}

// first admin edit copies the seed into the db
export async function ensureMaterialised(store: Store) {
  const rows = await store.ndStats();
  if (!rows.length) await store.upsertNdStats(SEED_STATS);
}

// up to 3 figures: the closest one for their picks first, then national-day-specific ones
export const MAX_REVEAL = 3;
export function pickRevealStats(all: NdStat[], picks: CategoryKey[]): NdStat[] {
  const [focus, ...rest] = picks;
  const active = all.filter((s) => s.status === "active");
  const generalNd = sortStats(active.filter((s) => s.national_day_specific));
  const primary = (focus && statsFor(all, focus)[0]) || rest.map((k) => statsFor(all, k)[0]).find(Boolean) || generalNd[0] || sortStats(active)[0];
  if (!primary) return [];
  const out: NdStat[] = [primary];
  const add = (s?: NdStat) => {
    if (s && out.length < MAX_REVEAL && !out.some((o) => o.id === s.id)) out.push(s);
  };
  rest.forEach((k) => add(statsFor(all, k).find((s) => s.national_day_specific)));
  picks.forEach((k) => statsFor(all, k).forEach(add));
  generalNd.forEach(add);
  sortStats(active).forEach(add);
  return out;
}
