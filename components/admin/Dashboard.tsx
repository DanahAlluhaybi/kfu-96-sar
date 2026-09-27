"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import type { Lang } from "@/lib/i18n";
import { MIN_THEME_MENTIONS } from "@/lib/stats";
import type { AdminOverview, AiPayload, InsightRow, ResponseRow } from "@/lib/types";
import { BrandLockup, LangToggle, Sparkle } from "../brand";
import { useI18n } from "../I18nProvider";
import { CategoryIcon, DownloadIcon, LogoutIcon, RefreshIcon, SearchIcon, TrashIcon } from "../icons";
import { BarList } from "../viz";
import { DistributionChart, TrendChart } from "./charts";
import NdAdmin from "./NdAdmin";

type Tab = "overview" | "analytics" | "responses" | "nd" | "insight" | "data";
const TABS: Tab[] = ["overview", "analytics", "responses", "nd", "insight", "data"];

function useFmt() {
  const { lang } = useI18n();
  return useMemo(() => {
    const locale = lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
    const dt = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Riyadh", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const time = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return { dt: (iso: string) => dt.format(new Date(iso)), time: (d: Date) => time.format(d), n: (v: number) => v.toLocaleString("en-US") };
  }, [lang]);
}

export default function Dashboard() {
  const { t } = useI18n();
  const fmt = useFmt();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminOverview | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        setData((await res.json()) as AdminOverview);
        setUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), 15_000);
    return () => clearInterval(id);
  }, [load]);

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-mist-50">
      <header className="sticky top-0 z-30 border-b border-mist-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLockup size="sm" />
            <span className="hidden h-8 w-px bg-mist-300 sm:block" />
            <span className="hidden h-8 w-px bg-mist-300 md:block" />
            <p className="hidden truncate text-sm font-semibold text-ink-500 md:block">{t.admin.title}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {updated && (
              <span className="num hidden text-xs text-ink-400 md:inline">
                {t.admin.lastUpdated}: {fmt.time(updated)}
              </span>
            )}
            <button type="button" onClick={load} className="btn-ghost" aria-label={t.admin.refresh}>
              <RefreshIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <LangToggle />
            <button type="button" onClick={signOut} className="btn-ghost" aria-label={t.admin.signOut}>
              <LogoutIcon className="h-5 w-5 rtl:-scale-x-100" />
              <span className="hidden lg:inline">{t.admin.signOut}</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6" aria-label="Sections">
          <ul className="flex gap-1">
            {TABS.map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setTab(k)}
                  aria-current={tab === k ? "page" : undefined}
                  className={`relative whitespace-nowrap px-3 py-3 text-sm font-semibold transition ${
                    tab === k ? "text-pine-800" : "text-ink-500 hover:text-pine-700"
                  }`}
                >
                  {t.admin.tabs[k]}
                  {tab === k && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-gold-500" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {!data ? (
          <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-28 bg-white" />
            ))}
          </div>
        ) : (
          <>
            {tab === "overview" && <Overview data={data} onTab={setTab} />}
            {tab === "analytics" && <Analytics data={data} />}
            {tab === "responses" && <Responses />}
            {tab === "nd" && <NdAdmin />}
            {tab === "insight" && <Insights />}
            {tab === "data" && <DataTab data={data} onRefresh={load} />}
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, sub, accent = false }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-card border p-5 ${accent ? "border-pine-800 bg-pine-800 text-white" : "border-mist-200 bg-white"}`}>
      <p className={`text-sm font-medium ${accent ? "text-white/70" : "text-ink-500"}`}>{label}</p>
      <p className={`num mt-2 text-3xl font-bold leading-none sm:text-4xl ${accent ? "text-white" : "text-pine-900"}`}>{value}</p>
      {sub && <p className={`mt-2 text-xs ${accent ? "text-gold-300" : "text-ink-400"}`}>{sub}</p>}
    </div>
  );
}

function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-pine-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CatChips({ keys }: { keys: CategoryKey[] }) {
  const { lang } = useI18n();
  return (
    <span className="flex flex-wrap gap-1.5">
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1 rounded-md bg-mist-100 px-2 py-0.5 text-xs font-semibold text-pine-900">
          <CategoryIcon k={k} className="h-3.5 w-3.5 text-pine-700" />
          {CATEGORIES[k]?.label[lang] ?? k}
        </span>
      ))}
    </span>
  );
}

function ResponsesTable({ rows }: { rows: ResponseRow[] }) {
  const { t } = useI18n();
  const fmt = useFmt();
  if (!rows.length) return <p className="py-10 text-center text-sm text-ink-400">{t.admin.noResponses}</p>;
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-y border-mist-200 bg-mist-50 text-start text-xs font-semibold text-ink-500">
            <th className="px-5 py-2.5 text-start sm:px-6">{t.admin.table.time}</th>
            <th className="px-3 py-2.5 text-start">{t.admin.table.categories}</th>
            <th className="px-3 py-2.5 text-start">{t.admin.table.custom}</th>
            <th className="px-5 py-2.5 text-start sm:px-6">{t.admin.table.lang}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-mist-100 last:border-0 hover:bg-pine-50/40">
              <td className="num whitespace-nowrap px-5 py-3 text-ink-500 sm:px-6">{fmt.dt(r.created_at)}</td>
              <td className="px-3 py-3">
                <CatChips keys={r.categories} />
              </td>
              <td className="max-w-[260px] truncate px-3 py-3 text-ink-700" title={r.custom_text ?? ""}>
                {r.custom_text ?? <span className="text-ink-300">—</span>}
              </td>
              <td className="px-5 py-3 text-xs font-semibold uppercase text-ink-400 sm:px-6">{r.lang}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightBlock({ row, lang }: { row: InsightRow | undefined | null; lang: Lang }) {
  const { t } = useI18n();
  const fmt = useFmt();
  return (
    <div className="relative overflow-hidden rounded-card bg-pine-800 p-6 text-white">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-gold-500">
          <Sparkle className="h-4 w-4" /> {t.insight.label}
        </span>
        <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">{lang}</span>
      </div>
      <p className="mt-3 text-xl font-bold leading-snug" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
        {row?.text ? row.text : <span className="text-white/50">{t.admin.noInsight}</span>}
      </p>
      {row && (
        <p className="num mt-4 text-xs text-white/60">
          {row.source === "ai" ? `${t.admin.sourceAi} · ${row.model}` : t.admin.sourceFallback} · {fmt.dt(row.created_at)}
        </p>
      )}
    </div>
  );
}

function Overview({ data, onTab }: { data: AdminOverview; onTab: (t: Tab) => void }) {
  const { t, lang } = useI18n();
  const fmt = useFmt();
  const top = data.top ? data.categories[0] : null;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi accent label={t.admin.kpi.total} value={fmt.n(data.total)} sub={`${fmt.n(data.selections)} ${t.results.picks}`} />
        <Kpi label={t.admin.kpi.today} value={fmt.n(data.today)} />
        <Kpi
          label={t.admin.kpi.top}
          value={top ? <span className="flex items-center gap-2 text-2xl sm:text-3xl"><CategoryIcon k={top.key} className="h-7 w-7 text-pine-700" />{CATEGORIES[top.key].label[lang]}</span> : "—"}
          sub={top ? `${top.share}% · ${fmt.n(top.count)} ${t.results.picks}` : undefined}
        />
        <Kpi label={t.admin.kpi.avg} value={data.avgPicks.toFixed(1)} sub={`${fmt.n(data.writeIns.total)} ${t.admin.writeInTotal}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={t.admin.distribution}>
          {data.total ? <BarList stats={data} /> : <p className="text-sm text-ink-400">{t.results.empty}</p>}
        </Panel>
        <div className="space-y-4">
          <InsightBlock row={data.insights[lang]} lang={lang} />
          <Panel
            title={t.admin.writeInsTitle}
            action={
              <button type="button" className="text-xs font-semibold text-pine-700 hover:underline" onClick={() => onTab("analytics")}>
                {t.admin.viewAll}
              </button>
            }
          >
            <WriteInList themes={data.writeIns.themes.slice(0, 5)} />
          </Panel>
        </div>
      </div>

      <Panel
        title={t.admin.latest}
        action={
          <button type="button" className="text-xs font-semibold text-pine-700 hover:underline" onClick={() => onTab("responses")}>
            {t.admin.viewAll}
          </button>
        }
      >
        <ResponsesTable rows={data.latest} />
      </Panel>
    </div>
  );
}

function WriteInList({ themes }: { themes: AdminOverview["writeIns"]["themes"] }) {
  const { t } = useI18n();
  if (!themes.length) return <p className="text-sm text-ink-400">{t.admin.noWriteIns}</p>;
  const max = themes[0].mentions;
  return (
    <ul className="space-y-2.5">
      {themes.map((w) => (
        <li key={w.key} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-semibold text-ink-900">{w.answer}</span>
              <span className="num shrink-0 text-xs text-ink-500">{t.admin.mentions(w.mentions)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-mist-100">
              <div className="h-full rounded-full bg-stone" style={{ width: `${(w.mentions / max) * 100}%` }} />
            </div>
          </div>
          {w.mentions >= MIN_THEME_MENTIONS && (
            <span className="shrink-0 rounded-md bg-gold-50 px-1.5 py-0.5 text-[10px] font-bold text-gold-700">{t.admin.sentToAi}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Analytics({ data }: { data: AdminOverview }) {
  const { t, lang } = useI18n();
  const fmt = useFmt();
  const [measure, setMeasure] = useState<"share" | "reach">("share");
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi accent label={t.admin.kpi.total} value={fmt.n(data.total)} />
        <Kpi label={t.admin.kpi.selections} value={fmt.n(data.selections)} />
        <Kpi label={t.admin.kpi.today} value={fmt.n(data.today)} />
      </div>

      <Panel title={t.admin.trend} action={<span className="text-xs font-semibold text-ink-400">{data.trend.granularity === "hour" ? t.admin.trendHourly : t.admin.trendDaily}</span>}>
        {data.trend.points.length ? <TrendChart points={data.trend.points} /> : <p className="text-sm text-ink-400">{t.results.empty}</p>}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel
          title={t.admin.distribution}
          action={
            <div className="inline-flex rounded-lg border border-mist-200 p-0.5 text-xs font-semibold">
              {(["share", "reach"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeasure(m)}
                  className={`rounded-md px-2.5 py-1 transition ${measure === m ? "bg-pine-800 text-white" : "text-ink-500 hover:text-pine-800"}`}
                >
                  {m === "share" ? t.admin.shareOfPicks : t.admin.shareOfPeople}
                </button>
              ))}
            </div>
          }
        >
          <DistributionChart data={data.categories} measure={measure} />
        </Panel>

        <Panel title={t.admin.distribution}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-200 text-xs text-ink-500">
                <th className="pb-2 text-start font-semibold" />
                <th className="pb-2 text-end font-semibold">{t.admin.count}</th>
                <th className="pb-2 text-end font-semibold">{t.admin.shareOfPicks}</th>
                <th className="pb-2 text-end font-semibold">{t.admin.shareOfPeople}</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.key} className="border-b border-mist-100 last:border-0">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2 font-semibold text-ink-900">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORIES[c.key].color }} />
                      <CategoryIcon k={c.key} className="h-4 w-4 text-pine-700" />
                      {CATEGORIES[c.key].label[lang]}
                    </span>
                  </td>
                  <td className="num py-2.5 text-end">{fmt.n(c.count)}</td>
                  <td className="num py-2.5 text-end font-bold text-pine-800">{c.share}%</td>
                  <td className="num py-2.5 text-end text-ink-500">{c.reach}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={t.admin.writeInsTitle}>
        <p className="-mt-3 mb-5 text-sm text-ink-500">{t.admin.writeInsSub}</p>
        <WriteInList themes={data.writeIns.themes} />
      </Panel>
    </div>
  );
}

function Responses() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey | "">("");
  const [rows, setRows] = useState<ResponseRow[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      const p = new URLSearchParams({ limit: "300" });
      if (q.trim()) p.set("q", q.trim());
      if (cat) p.set("category", cat);
      try {
        const res = await fetch(`/api/admin/responses?${p}`, { signal: ctrl.signal, cache: "no-store" });
        if (res.ok) {
          const d = (await res.json()) as { rows: ResponseRow[]; total: number };
          setRows(d.rows);
          setTotal(d.total);
        }
      } catch {
        /* aborted */
      }
    }, 250);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, cat]);

  return (
    <Panel title={t.admin.tabs.responses} action={rows && <span className="num text-xs text-ink-400">{t.admin.showing(rows.length, total)}</span>}>
      <div className="mb-4 flex flex-col gap-3">
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.admin.search}
            className="h-11 w-full rounded-xl border border-mist-300 bg-white pe-3 ps-9 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-100"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(["", ...CATEGORY_KEYS] as const).map((k) => (
            <button
              key={k || "all"}
              type="button"
              onClick={() => setCat(k)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                cat === k ? "border-pine-800 bg-pine-800 text-white" : "border-mist-300 bg-white text-ink-700 hover:border-pine-500"
              }`}
            >
              {k ? (
                <span className="flex items-center gap-1.5">
                  <CategoryIcon k={k} className="h-3.5 w-3.5" />
                  {CATEGORIES[k].label[lang]}
                </span>
              ) : (
                t.admin.allCategories
              )}
            </button>
          ))}
        </div>
      </div>
      {rows ? <ResponsesTable rows={rows} /> : <div className="h-40 animate-pulse rounded-xl bg-mist-50" />}
    </Panel>
  );
}

function Insights() {
  const { t } = useI18n();
  const [state, setState] = useState<{
    insights: Partial<Record<Lang, InsightRow | null>>;
    payload: AiPayload;
    aiEnabled: boolean;
    minResponses: number;
  } | null>(null);
  const [busy, setBusy] = useState<Lang | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/insight", { cache: "no-store" });
    if (res.ok) setState(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function regen(lang: Lang) {
    setBusy(lang);
    setMsg(null);
    const res = await fetch("/api/admin/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    if (res.status === 409) {
      const d = (await res.json()) as { minResponses: number };
      setMsg(`${t.insight.waiting} (min ${d.minResponses})`);
    }
    await load();
    setBusy(null);
  }

  if (!state) return <div className="card h-64 animate-pulse bg-white" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-500">{t.admin.ai}:</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${state.aiEnabled ? "bg-pine-50 text-pine-800" : "bg-gold-50 text-gold-700"}`}>
          {state.aiEnabled ? t.admin.aiOn : t.admin.aiOff}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {(["ar", "en"] as Lang[]).map((l) => (
          <div key={l} className="space-y-3">
            <InsightBlock row={state.insights[l]} lang={l} />
            <button type="button" onClick={() => regen(l)} disabled={busy !== null} className="btn-secondary w-full">
              <Sparkle className="h-4 w-4" />
              {busy === l ? t.admin.regenerating : `${t.admin.regenerate} · ${l.toUpperCase()}`}
            </button>
          </div>
        ))}
      </div>
      {msg && <p className="rounded-lg bg-gold-50 px-3 py-2 text-sm text-gold-700">{msg}</p>}

      <Panel title={t.admin.payloadTitle}>
        <p className="-mt-3 mb-4 text-sm text-ink-500">{t.admin.payloadNote}</p>
        <pre dir="ltr" className="max-h-[420px] overflow-auto rounded-xl bg-ink-900 p-4 text-xs leading-relaxed text-pine-100">
          {JSON.stringify(state.payload, null, 2)}
        </pre>
      </Panel>
    </div>
  );
}

function DataTab({ data, onRefresh }: { data: AdminOverview; onRefresh: () => Promise<void> }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: phrase }),
    });
    setBusy(false);
    if (res.ok) {
      setConfirming(false);
      setPhrase("");
      setDone(t.admin.resetDone);
      await onRefresh();
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="card flex flex-col p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-50 text-pine-800">
          <DownloadIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-bold text-pine-900">{t.admin.exportTitle}</h2>
        <p className="mt-1 flex-1 text-sm text-ink-500">{t.admin.exportSub}</p>
        <a href="/api/admin/export" className="btn-primary mt-5 h-12">
          <DownloadIcon className="h-5 w-5" /> {t.admin.exportBtn}
        </a>
      </section>

      <section className="card flex flex-col p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-50 text-pine-800">
          <RefreshIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-bold text-pine-900">{t.admin.refreshTitle}</h2>
        <p className="mt-1 flex-1 text-sm text-ink-500">{t.admin.refreshSub}</p>
        <dl className="mt-4 space-y-1 text-xs text-ink-500">
          <div className="flex justify-between">
            <dt>{t.admin.storage}</dt>
            <dd className="font-semibold text-ink-700">{data.storage === "supabase" ? t.admin.storageSupabase : t.admin.storageLocal}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t.admin.ai}</dt>
            <dd className="font-semibold text-ink-700">{data.aiEnabled ? t.admin.aiOn : t.admin.aiOff}</dd>
          </div>
        </dl>
        <button type="button" onClick={onRefresh} className="btn-secondary mt-5">
          <RefreshIcon className="h-5 w-5" /> {t.admin.refresh}
        </button>
      </section>

      <section className="card flex flex-col border-red-200 p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-700">
          <TrashIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-bold text-red-800">{t.admin.resetTitle}</h2>
        <p className="mt-1 flex-1 text-sm text-ink-500">{t.admin.resetSub}</p>
        {done && <p className="mt-3 rounded-lg bg-pine-50 px-3 py-2 text-sm font-semibold text-pine-800">{done}</p>}
        {!confirming ? (
          <button type="button" onClick={() => { setConfirming(true); setDone(null); }} className="btn mt-5 h-12 border border-red-300 bg-white text-red-700 hover:bg-red-50">
            <TrashIcon className="h-5 w-5" /> {t.admin.resetBtn}
          </button>
        ) : (
          <div className="mt-5 space-y-2">
            <label className="block text-xs font-semibold text-ink-700" htmlFor="reset">
              {t.admin.resetConfirm}
            </label>
            <input
              id="reset"
              dir="ltr"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              className="h-11 w-full rounded-xl border border-red-300 px-3 font-mono text-sm outline-none focus:ring-4 focus:ring-red-100"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="btn-secondary h-11 flex-1">
                {t.admin.cancel}
              </button>
              <button type="button" onClick={reset} disabled={phrase !== "RESET" || busy} className="btn h-11 flex-1 bg-red-700 text-white hover:bg-red-800">
                {t.admin.resetDo}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
