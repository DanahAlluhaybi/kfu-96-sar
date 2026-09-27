"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalystResult, ReportItem, Step } from "@/lib/analyst";
import { Sparkle } from "../brand";
import { useI18n } from "../I18nProvider";
import { DownloadIcon, SearchIcon, TrashIcon } from "../icons";

const STORE_KEY = "kfu96.playbook.v1";
const MAX_SAVED = 20;

function readSaved(): AnalystResult[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeSaved(list: AnalystResult[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, MAX_SAVED)));
  } catch {
    // no storage (private mode etc), reports just won't persist
  }
}

function toMarkdown(r: AnalystResult, t: ReturnType<typeof useI18n>["t"]) {
  const a = t.admin.analyst;
  const items = (xs: ReportItem[]) => xs.map((x) => `- **${x.title}** — ${x.detail}`).join("\n");
  return [
    `# ${r.report.title}`,
    `> ${r.question}`,
    `_${new Date(r.meta.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })} · ${r.meta.model}_`,
    `## ${a.summary}\n${r.report.summary}`,
    `## ${a.findings}\n${items(r.report.findings)}`,
    `## ${a.recommendations}\n${items(r.report.recommendations)}`,
    r.report.caveats.length ? `## ${a.caveats}\n${r.report.caveats.map((c) => `- ${c}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function download(r: AnalystResult, t: ReturnType<typeof useI18n>["t"]) {
  const blob = new Blob([toMarkdown(r, t)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = `playbook-${r.meta.createdAt.slice(0, 16).replace(/[:T]/g, "-")}.md`;
  el.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Evidence({ ids, steps }: { ids: string[]; steps: Step[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const used = steps.filter((s) => ids.includes(s.id));
  if (!used.length) return null;
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-pine-700 underline decoration-pine-200 underline-offset-4 hover:decoration-pine-600">
        {open ? t.admin.analyst.hideEvidence : `${t.admin.analyst.evidence} · ${used.map((s) => t.admin.analyst.tools[s.tool] ?? s.tool).join("، ")}`}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {used.map((s) => (
            <div key={s.id} className="rounded-xl bg-ink-900 p-3">
              <p className="mb-1 text-[11px] font-bold text-gold-300">
                {t.admin.analyst.tools[s.tool] ?? s.tool}
                {typeof s.input.category === "string" ? ` · ${s.input.category}` : ""}
              </p>
              <pre dir="ltr" className="max-h-56 overflow-auto text-[11px] leading-relaxed text-pine-100">
                {JSON.stringify(s.output, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Items({ title, items, steps, accent }: { title: string; items: ReportItem[]; steps: Step[]; accent?: boolean }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-pine-900">{title}</h3>
      <ol className="grid gap-3 md:grid-cols-2">
        {items.map((it, i) => (
          <li key={i} className={`rounded-card border p-4 ${accent ? "border-gold-100 bg-gold-50/60" : "border-mist-200 bg-white"}`}>
            <p className="flex items-start gap-2 font-bold text-ink-900">
              <span className={`num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] ${accent ? "bg-gold-500 text-ink-900" : "bg-pine-800 text-white"}`}>{i + 1}</span>
              {it.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{it.detail}</p>
            <Evidence ids={it.evidence} steps={steps} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReportView({ r, onDownload }: { r: AnalystResult; onDownload: () => void }) {
  const { t } = useI18n();
  const a = t.admin.analyst;
  return (
    <article className="card space-y-7 p-5 sm:p-7" dir={r.lang === "ar" ? "rtl" : "ltr"} lang={r.lang}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-ink-400">{r.question}</p>
          <h2 className="mt-1 font-display text-2xl font-bold leading-snug text-pine-900">{r.report.title}</h2>
        </div>
        <button type="button" onClick={onDownload} className="btn-secondary h-10 shrink-0 px-4 text-sm">
          <DownloadIcon className="h-4 w-4" /> {a.download}
        </button>
      </header>

      <section className="rounded-card bg-pine-800 p-5 text-white">
        <p className="flex items-center gap-2 text-xs font-bold text-gold-300">
          <Sparkle className="h-3.5 w-3.5" /> {a.summary}
        </p>
        <p className="mt-2 leading-relaxed">{r.report.summary}</p>
      </section>

      <Items title={a.findings} items={r.report.findings} steps={r.steps} />
      <Items title={a.recommendations} items={r.report.recommendations} steps={r.steps} accent />

      {r.report.caveats.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-pine-900">{a.caveats}</h3>
          <ul className="list-disc space-y-1 ps-5 text-sm text-ink-500">
            {r.report.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="num flex flex-wrap gap-x-4 gap-y-1 border-t border-mist-200 pt-4 text-xs text-ink-400">
        <span>{a.verified(r.meta.verified, r.meta.rejected)}</span>
        <span>{a.steps(r.steps.length)}</span>
        <span dir="ltr">
          {r.meta.model} · {(r.meta.ms / 1000).toFixed(1)}s · {r.meta.inputTokens + r.meta.outputTokens} tokens
        </span>
      </footer>
    </article>
  );
}

export default function Analyst() {
  const { t, lang } = useI18n();
  const a = t.admin.analyst;
  const [status, setStatus] = useState<{ enabled: boolean; responses: number; minResponses: number } | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [current, setCurrent] = useState<AnalystResult | null>(null);
  const [saved, setSaved] = useState<AnalystResult[]>([]);

  useEffect(() => {
    setSaved(readSaved());
    fetch("/api/admin/analyst", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const run = useCallback(
    async (question?: string) => {
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/admin/analyst", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, question }),
        });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const d = await res.json();
        if (!res.ok) {
          setErr(
            d.error === "ai_disabled" ? a.disabled : d.error === "not_enough_data" ? a.notEnough(d.minResponses) : d.error === "rate_limited" ? a.limited : a.failed,
          );
          return;
        }
        const r = d as AnalystResult;
        setCurrent(r);
        const next = [r, ...readSaved()].slice(0, MAX_SAVED);
        writeSaved(next);
        setSaved(next);
      } catch {
        setErr(a.failed);
      } finally {
        setBusy(false);
      }
    },
    [lang, a],
  );

  function remove(createdAt: string) {
    const next = saved.filter((s) => s.meta.createdAt !== createdAt);
    writeSaved(next);
    setSaved(next);
    if (current?.meta.createdAt === createdAt) setCurrent(null);
  }

  const off = status ? !status.enabled : false;
  const few = status ? status.responses < status.minResponses : false;
  const blocked = busy || off || few;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-5">
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-pine-900">{a.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">{a.sub}</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button type="button" onClick={() => run()} disabled={blocked} className="btn-primary h-auto min-h-14 flex-col items-start gap-0.5 px-5 py-3 text-start sm:w-64">
              <span className="flex items-center gap-2">
                <Sparkle className="h-4 w-4" /> {a.pulse}
              </span>
              <span className="text-xs font-medium text-white/70">{a.pulseSub}</span>
            </button>
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) run(q.trim());
              }}
            >
              <label className="relative block flex-1">
                <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  maxLength={400}
                  placeholder={a.askPlaceholder}
                  className="h-full min-h-12 w-full rounded-xl border border-mist-300 bg-white pe-3 ps-9 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-100"
                />
              </label>
              <button type="submit" disabled={blocked || !q.trim()} className="btn-secondary h-auto min-h-12 px-5">
                {a.ask}
              </button>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {a.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={blocked}
                onClick={() => {
                  setQ(s);
                  run(s);
                }}
                className="rounded-full border border-mist-300 bg-white px-3 py-1 text-xs font-semibold text-pine-800 transition hover:border-pine-500 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {(off || few) && status && <p className="mt-4 rounded-lg bg-gold-50 px-3 py-2 text-sm text-gold-700">{off ? a.disabled : a.notEnough(status.minResponses)}</p>}
          {err && <p className="mt-4 rounded-lg bg-gold-50 px-3 py-2 text-sm text-gold-700">{err}</p>}
        </section>

        {busy ? (
          <div className="card flex items-center gap-4 p-6">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-pine-100 border-t-pine-700" />
            <div>
              <p className="font-bold text-pine-900">{a.working}</p>
              <p className="text-sm text-ink-500">{a.workingSub}</p>
            </div>
          </div>
        ) : (
          current && <ReportView r={current} onDownload={() => download(current, t)} />
        )}
      </div>

      <aside className="card h-fit p-5">
        <h3 className="text-sm font-bold text-pine-900">{a.saved}</h3>
        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">{a.noSaved}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {saved.map((s) => (
              <li
                key={s.meta.createdAt}
                className={`rounded-xl border p-3 transition ${current?.meta.createdAt === s.meta.createdAt ? "border-pine-500 bg-pine-50/50" : "border-mist-200"}`}
              >
                <button type="button" onClick={() => setCurrent(s)} className="block w-full text-start">
                  <p className="line-clamp-2 text-sm font-semibold text-ink-900">{s.report.title}</p>
                  <p className="num mt-1 text-[11px] text-ink-400">
                    {new Date(s.meta.createdAt).toLocaleString(lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
                      timeZone: "Asia/Riyadh",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
                <div className="mt-2 flex gap-3 text-xs font-semibold">
                  <button type="button" onClick={() => download(s, t)} className="text-pine-700 hover:underline">
                    {a.download}
                  </button>
                  <button type="button" onClick={() => remove(s.meta.createdAt)} className="inline-flex items-center gap-1 text-ink-400 hover:text-red-600">
                    <TrashIcon className="h-3.5 w-3.5" /> {a.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
