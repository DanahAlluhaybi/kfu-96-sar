"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import { PERIOD_TYPES, type NdStat, type PeriodType } from "@/lib/nd";
import { useI18n } from "../I18nProvider";
import { SourceLine } from "../nd";
import { CategoryIcon } from "../icons";

type Draft = Omit<NdStat, "change_pct" | "value"> & { value: string; change_pct: string };

const EMPTY: Draft = {
  id: "",
  status: "active",
  priority: 1,
  categories: [],
  national_day_specific: false,
  period_type: "national_day_week",
  period_start: "2026-09-20",
  period_end: "2026-09-26",
  period_label: { ar: "أسبوع اليوم الوطني 96 · 20–26 سبتمبر 2026", en: "National Day 96 week · 20–26 Sep 2026" },
  stat: { ar: "", en: "" },
  value: "",
  unit: "SAR",
  display: { ar: "", en: "" },
  change_pct: "",
  change_label: { ar: "مقارنة بالأسبوع اللي قبله", en: "vs the previous week" },
  source_org: { ar: "البنك المركزي السعودي", en: "Saudi Central Bank (SAMA)" },
  source_url: "https://www.sama.gov.sa/ar-sa/Indices/pages/pos.aspx",
  source_note: null,
  verified_via: [],
  published_at: "",
};

const PERIOD_NAMES: Record<PeriodType, string> = {
  national_day: "National Day-specific (source names the occasion)",
  national_day_week: "Week containing 23 Sep",
  pre_national_day_week: "Week before National Day",
  post_national_day_week: "Week after National Day",
  september: "September (month)",
  quarter: "Quarter (Q3)",
};

// lives outside the form component so inputs don't lose focus on every keystroke
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

export default function NdAdmin() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<NdStat[] | null>(null);
  const [usingSeed, setUsingSeed] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/nd-data", { cache: "no-store" });
    if (r.ok) {
      const d = (await r.json()) as { stats: NdStat[]; usingSeed: boolean };
      setStats(d.stats);
      setUsingSeed(d.usingSeed);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function edit(s?: NdStat) {
    setErr(null);
    setDraft(
      s
        ? { ...s, value: String(s.value), change_pct: s.change_pct === null ? "" : String(s.change_pct) }
        : { ...EMPTY, id: `nd-${Date.now().toString(36)}` },
    );
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr(null);
    const body = {
      ...draft,
      value: Number(draft.value),
      change_pct: draft.change_pct.trim() === "" ? null : Number(draft.change_pct),
      national_day_specific: draft.period_type === "national_day" ? draft.national_day_specific : false,
    };
    const r = await fetch("/api/admin/nd-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) {
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      setErr(`${t.admin.ndInvalid} (${d.error ?? r.status})`);
      return;
    }
    setDraft(null);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/nd-data?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  }

  const input = "h-10 w-full rounded-lg border border-mist-300 bg-white px-3 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-100";
  const pair = (key: "period_label" | "stat" | "display" | "source_org", label: string) =>
    draft && (
      <div className="grid gap-2 sm:grid-cols-2">
        <L label={`${label} (AR)`}>
          <input dir="rtl" className={input} value={draft[key].ar} onChange={(e) => setDraft({ ...draft, [key]: { ...draft[key], ar: e.target.value } })} />
        </L>
        <L label={`${label} (EN)`}>
          <input dir="ltr" className={input} value={draft[key].en} onChange={(e) => setDraft({ ...draft, [key]: { ...draft[key], en: e.target.value } })} />
        </L>
      </div>
    );

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-pine-900">{t.admin.ndTitle}</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-500">{t.admin.ndSub}</p>
            {usingSeed && <p className="mt-2 text-xs font-semibold text-gold-700">{t.admin.ndSeed}</p>}
          </div>
          <button type="button" className="btn-primary h-11" onClick={() => edit()}>
            + {t.admin.ndAdd}
          </button>
        </div>
      </section>

      {draft && (
        <section className="card space-y-4 border-pine-300 p-5 sm:p-6" dir="ltr">
          <div className="grid gap-3 sm:grid-cols-4">
            <L label="ID">
              <input className={input} value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
            </L>
            <L label="Status">
              <select className={input} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as NdStat["status"] })}>
                <option value="active">{t.admin.ndActive}</option>
                <option value="reference">{t.admin.ndReference}</option>
              </select>
            </L>
            <L label="Period type">
              <select className={input} value={draft.period_type} onChange={(e) => setDraft({ ...draft, period_type: e.target.value as PeriodType })}>
                {PERIOD_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_NAMES[p]}
                  </option>
                ))}
              </select>
            </L>
            <L label="Priority (1 = first)">
              <input type="number" min={1} className={input} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })} />
            </L>
          </div>

          {draft.period_type === "national_day" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.national_day_specific} onChange={(e) => setDraft({ ...draft, national_day_specific: e.target.checked })} />
              The source explicitly ties this figure to National Day
            </label>
          )}

          <div>
            <span className="mb-1 block text-xs font-semibold text-ink-700">Related picks</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map((k: CategoryKey) => {
                const on = draft.categories.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDraft({ ...draft, categories: on ? draft.categories.filter((x) => x !== k) : [...draft.categories, k] })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-pine-800 bg-pine-800 text-white" : "border-mist-300"}`}
                  >
                    <span className="flex items-center gap-1.5"><CategoryIcon k={k} className="h-3.5 w-3.5" />{CATEGORIES[k].label.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <L label="Period start">
              <input type="date" className={input} value={draft.period_start} onChange={(e) => setDraft({ ...draft, period_start: e.target.value })} />
            </L>
            <L label="Period end">
              <input type="date" className={input} value={draft.period_end} onChange={(e) => setDraft({ ...draft, period_end: e.target.value })} />
            </L>
            <L label="Publication date">
              <input type="date" className={input} value={draft.published_at} onChange={(e) => setDraft({ ...draft, published_at: e.target.value })} />
            </L>
          </div>
          {pair("period_label", "Period label")}
          {pair("stat", "Statistic")}

          <div className="grid gap-3 sm:grid-cols-3">
            <L label="Value (raw number)">
              <input className={input} inputMode="decimal" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
            </L>
            <L label="Unit">
              <select className={input} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as NdStat["unit"] })}>
                <option value="SAR">SAR</option>
                <option value="count">count</option>
                <option value="percent">percent</option>
              </select>
            </L>
            <L label="Change vs previous period % (optional)">
              <input className={input} inputMode="decimal" value={draft.change_pct} onChange={(e) => setDraft({ ...draft, change_pct: e.target.value })} />
            </L>
          </div>
          {pair("display", "Displayed value")}
          {pair("source_org", "Source organisation")}
          <L label="Source URL (https)">
            <input className={input} value={draft.source_url} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} />
          </L>

          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn-primary h-11" disabled={busy} onClick={save}>
              {t.admin.ndSave}
            </button>
            <button type="button" className="btn-secondary h-11" onClick={() => setDraft(null)}>
              {t.admin.cancel}
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {(stats ?? []).map((s) => (
          <article key={s.id} className={`card p-5 ${s.status === "reference" ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className={`rounded-md px-2 py-0.5 ${s.status === "active" ? "bg-pine-800 text-white" : "bg-mist-200 text-ink-700"}`}>
                  {s.status === "active" ? t.admin.ndActive : t.admin.ndReference}
                </span>
                {s.national_day_specific && <span className="rounded-md bg-gold-100 px-2 py-0.5 text-gold-700">{t.nd.ndSpecific}</span>}
                <span className="rounded-md bg-mist-100 px-2 py-0.5 text-ink-700">{s.period_type}</span>
              </span>
              <span className="flex gap-1 text-pine-700" aria-hidden>
                {s.categories.map((k) => (
                  <CategoryIcon key={k} k={k} className="h-4 w-4" />
                ))}
              </span>
            </div>
            <p className="num mt-3 text-2xl font-bold text-pine-800" dir="auto">
              {s.display[lang]}
            </p>
            <p className="mt-1 text-sm text-ink-900">{s.stat[lang]}</p>
            <p className="mt-1 text-xs text-ink-500">
              {s.period_label[lang]}
              {s.change_pct !== null && <span dir="ltr"> · {s.change_pct > 0 ? "+" : ""}{s.change_pct}%</span>}
            </p>
            <div className="mt-3 border-t border-mist-100 pt-3">
              <SourceLine s={s} />
              {s.verified_via && s.verified_via.length > 0 && (
                <p className="mt-1 text-[11px] text-ink-400" dir="ltr">
                  verified via: {s.verified_via.map((u) => new URL(u).hostname).join(", ")}
                </p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-ghost h-8 text-xs" onClick={() => edit(s)}>
                {t.admin.ndEdit}
              </button>
              <button type="button" className="btn-ghost h-8 text-xs text-red-700 hover:bg-red-50" onClick={() => remove(s.id)}>
                {t.admin.ndDelete}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
