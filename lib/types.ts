import type { CategoryKey } from "./categories";
import type { Lang } from "./i18n";

export type ResponseRow = {
  id: string;
  created_at: string;
  categories: CategoryKey[];
  custom_text: string | null;
  lang: Lang;
};

export type InsightRow = {
  id: string;
  created_at: string;
  lang: Lang;
  text: string;
  source: "ai" | "fallback";
  model: string | null;
  total: number;
  payload: AiPayload;
};

export type CategoryStat = {
  key: CategoryKey;
  count: number;
  share: number; // % of all picks, sums to 100
  reach: number; // % of people who picked it
};

export type PublicStats = {
  total: number;
  selections: number;
  categories: CategoryStat[];
  top: CategoryKey | null;
  updatedAt: string;
};

export type AiPayload = {
  event: string;
  budget_sar: 96;
  total_responses: number;
  total_picks: number;
  avg_picks_per_response: number;
  categories: { category: string; picks: number; share_of_picks_pct: number; share_of_people_pct: number }[];
  top_category: string | null;
  experiences_vs_things: { experiences_pct: number; things_pct: number };
  write_in_total: number;
  // only themes with MIN_THEME_MENTIONS+ mentions
  write_in_themes: { answer: string; mentions: number }[];
  // separate dataset, official sources only
  official_national_day_context: OfficialContextItem[];
};

export type OfficialContextItem = {
  id: string;
  related_campaign_categories: string[];
  stat_en: string;
  stat_ar: string;
  value_en: string;
  value_ar: string;
  change_vs_previous_period_pct: number | null;
  period_en: string;
  period_ar: string;
  period_type: string;
  national_day_specific: boolean;
  source: string;
  connect_ar: string | null;
  connect_en: string | null;
};

export type WriteInTheme = { key: string; answer: string; mentions: number; lastAt: string };

export type TrendPoint = { t: string; label: string; count: number };

export type AdminOverview = PublicStats & {
  today: number;
  avgPicks: number;
  trend: { granularity: "hour" | "day"; points: TrendPoint[] };
  latest: ResponseRow[];
  insights: Partial<Record<Lang, InsightRow>>;
  writeIns: { total: number; themes: WriteInTheme[] };
  storage: "supabase" | "local";
  aiEnabled: boolean;
};
