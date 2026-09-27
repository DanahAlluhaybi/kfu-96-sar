// Supabase in production (service key, server only), .data/db.json locally.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CategoryKey } from "./categories";
import type { Lang } from "./i18n";
import type { NdStat } from "./nd";
import type { InsightRow, ResponseRow } from "./types";

export type NewResponse = { categories: CategoryKey[]; custom_text: string | null; lang: Lang };
export type NewInsight = Omit<InsightRow, "id" | "created_at">;
export type ListQuery = { q?: string; category?: CategoryKey; limit?: number };
export type StatRow = Pick<ResponseRow, "categories" | "created_at">;
export type CustomAnswerRow = { id: string; created_at: string; response_id: string; text: string; normalized: string; lang: Lang };
export type NewCustomAnswer = Omit<CustomAnswerRow, "id" | "created_at">;

export interface Store {
  kind: "supabase" | "local";
  insertResponse(r: NewResponse): Promise<string>;
  insertCustomAnswer(c: NewCustomAnswer): Promise<void>;
  customAnswers(): Promise<CustomAnswerRow[]>;
  statRows(): Promise<StatRow[]>;
  listResponses(q: ListQuery): Promise<{ rows: ResponseRow[]; total: number }>;
  allResponses(): Promise<ResponseRow[]>;
  insertInsight(i: NewInsight): Promise<InsightRow>;
  latestInsight(lang: Lang): Promise<InsightRow | null>;
  clearAll(): Promise<void>;
  // empty = nothing edited yet, fall back to the seed file
  ndStats(): Promise<NdStat[]>;
  upsertNdStats(stats: NdStat[]): Promise<void>;
  deleteNdStat(id: string): Promise<void>;
}

function supabaseStore(url: string, key: string): Store {
  const base = url.replace(/\/+$/, "") + "/rest/v1";
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  async function req(pathAndQuery: string, init: RequestInit = {}) {
    const res = await fetch(base + pathAndQuery, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase ${res.status}: ${body.slice(0, 300)}`);
    }
    return res;
  }

  // supabase returns max 1000 rows per request
  async function paged<T>(pathAndQuery: string, max = 50_000): Promise<T[]> {
    const out: T[] = [];
    const size = 1000;
    for (let from = 0; from < max; from += size) {
      const res = await req(pathAndQuery, { headers: { Range: `${from}-${from + size - 1}`, "Range-Unit": "items" } });
      const chunk = (await res.json()) as T[];
      out.push(...chunk);
      if (chunk.length < size) break;
    }
    return out;
  }

  function likeEscape(s: string) {
    // these chars mean something in postgrest filters
    return s.replace(/[*,()%\\]/g, " ").trim();
  }

  return {
    kind: "supabase",
    async insertResponse(r) {
      const res = await req("/responses?select=id", {
        method: "POST",
        body: JSON.stringify(r),
        headers: { Prefer: "return=representation" },
      });
      const [row] = (await res.json()) as { id: string }[];
      return row.id;
    },
    async insertCustomAnswer(c) {
      await req("/custom_answers", { method: "POST", body: JSON.stringify(c), headers: { Prefer: "return=minimal" } });
    },
    async customAnswers() {
      return paged<CustomAnswerRow>("/custom_answers?select=*&order=created_at.asc");
    },
    async statRows() {
      return paged<StatRow>("/responses?select=categories,created_at&order=created_at.asc");
    },
    async listResponses({ q, category, limit = 200 }) {
      const params = new URLSearchParams({
        select: "id,created_at,categories,custom_text,lang",
        order: "created_at.desc",
        limit: String(Math.min(Math.max(limit, 1), 1000)),
      });
      if (category) params.append("categories", `cs.{${category}}`);
      const term = q ? likeEscape(q) : "";
      if (term) params.append("custom_text", `ilike.*${term}*`);
      const res = await req(`/responses?${params.toString()}`, { headers: { Prefer: "count=exact" } });
      const rows = (await res.json()) as ResponseRow[];
      const range = res.headers.get("content-range"); // "0-199/1234"
      const total = range && range.includes("/") ? Number(range.split("/")[1]) || rows.length : rows.length;
      return { rows, total };
    },
    async allResponses() {
      return paged<ResponseRow>("/responses?select=id,created_at,categories,custom_text,lang&order=created_at.asc", 200_000);
    },
    async insertInsight(i) {
      const res = await req("/insights", {
        method: "POST",
        body: JSON.stringify(i),
        headers: { Prefer: "return=representation" },
      });
      const [row] = (await res.json()) as InsightRow[];
      return row;
    },
    async latestInsight(lang) {
      const res = await req(`/insights?select=*&lang=eq.${lang}&order=created_at.desc&limit=1`);
      const rows = (await res.json()) as InsightRow[];
      return rows[0] ?? null;
    },
    async ndStats() {
      const res = await req("/nd_stats?select=data&order=id.asc");
      return ((await res.json()) as { data: NdStat }[]).map((r) => r.data);
    },
    async upsertNdStats(stats) {
      if (!stats.length) return;
      await req("/nd_stats?on_conflict=id", {
        method: "POST",
        body: JSON.stringify(stats.map((s) => ({ id: s.id, data: s, updated_at: new Date().toISOString() }))),
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      });
    },
    async deleteNdStat(id) {
      await req(`/nd_stats?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    async clearAll() {
      await req("/custom_answers?id=not.is.null", { method: "DELETE" });
      await req("/responses?id=not.is.null", { method: "DELETE" });
      await req("/insights?id=not.is.null", { method: "DELETE" });
    },
  };
}

type LocalData = { responses: ResponseRow[]; custom_answers: CustomAnswerRow[]; insights: InsightRow[]; nd_stats: NdStat[] };

function localStore(): Store {
  const file = path.join(process.cwd(), ".data", "db.json");
  let cache: LocalData | null = null;
  let writing: Promise<void> = Promise.resolve();
  let persistent = true;

  async function load(): Promise<LocalData> {
    if (cache) return cache;
    try {
      const parsed = JSON.parse(await fs.readFile(file, "utf8")) as Partial<LocalData>;
      cache = {
        responses: parsed.responses ?? [],
        custom_answers: parsed.custom_answers ?? [],
        insights: parsed.insights ?? [],
        nd_stats: parsed.nd_stats ?? [],
      };
    } catch {
      cache = { responses: [], custom_answers: [], insights: [], nd_stats: [] };
    }
    return cache;
  }
  function save() {
    if (!persistent || !cache) return writing;
    const snapshot = JSON.stringify(cache);
    writing = writing.then(async () => {
      try {
        await fs.mkdir(path.dirname(file), { recursive: true });
        const tmp = file + ".tmp";
        await fs.writeFile(tmp, snapshot);
        await fs.rename(tmp, file);
      } catch (e) {
        persistent = false; // read-only fs on serverless, keep it in memory
        console.warn("[96] Local storage is not writable; data is in memory only. Configure Supabase.", e);
      }
    });
    return writing;
  }

  return {
    kind: "local",
    async insertResponse(r) {
      const d = await load();
      const id = randomUUID();
      d.responses.push({ id, created_at: new Date().toISOString(), ...r });
      await save();
      return id;
    },
    async insertCustomAnswer(c) {
      const d = await load();
      d.custom_answers.push({ id: randomUUID(), created_at: new Date().toISOString(), ...c });
      await save();
    },
    async customAnswers() {
      return (await load()).custom_answers.slice();
    },
    async statRows() {
      const d = await load();
      return d.responses.map(({ categories, created_at }) => ({ categories, created_at }));
    },
    async listResponses({ q, category, limit = 200 }) {
      const d = await load();
      const term = q?.trim().toLowerCase();
      const filtered = d.responses
        .filter((r) => (category ? r.categories.includes(category) : true))
        .filter((r) => (term ? (r.custom_text ?? "").toLowerCase().includes(term) : true))
        .slice()
        .reverse();
      return { rows: filtered.slice(0, limit), total: filtered.length };
    },
    async allResponses() {
      return (await load()).responses.slice();
    },
    async insertInsight(i) {
      const d = await load();
      const row: InsightRow = { id: randomUUID(), created_at: new Date().toISOString(), ...i };
      d.insights.push(row);
      if (d.insights.length > 200) d.insights = d.insights.slice(-200);
      await save();
      return row;
    },
    async latestInsight(lang) {
      const d = await load();
      for (let i = d.insights.length - 1; i >= 0; i--) if (d.insights[i].lang === lang) return d.insights[i];
      return null;
    },
    async ndStats() {
      return (await load()).nd_stats.slice();
    },
    async upsertNdStats(stats) {
      const d = await load();
      for (const s of stats) {
        const i = d.nd_stats.findIndex((x) => x.id === s.id);
        if (i >= 0) d.nd_stats[i] = s;
        else d.nd_stats.push(s);
      }
      await save();
    },
    async deleteNdStat(id) {
      const d = await load();
      d.nd_stats = d.nd_stats.filter((s) => s.id !== id);
      await save();
    },
    async clearAll() {
      // keeps the official stats
      const d = await load();
      cache = { responses: [], custom_answers: [], insights: [], nd_stats: d.nd_stats };
      await save();
    },
  };
}

const g = globalThis as unknown as { __store96?: Store };

export function getStore(): Store {
  if (g.__store96) return g.__store96;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__store96 = url && key ? supabaseStore(url, key) : localStore();
  return g.__store96;
}
