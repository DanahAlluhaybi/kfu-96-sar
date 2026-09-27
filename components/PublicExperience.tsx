"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import { CUSTOM_MAX } from "@/lib/sanitize";
import type { PublicStats } from "@/lib/types";
import { BarsMark, BrandHeader, BrushStroke, HeritageBand, SiteFooter, Sparkle, TwinStar, YearMark } from "./brand";
import { useI18n } from "./I18nProvider";
import { ArrowIcon, BackIcon, CategoryIcon, CheckIcon } from "./icons";
import { OfficialReveal } from "./nd";
import { useStats } from "./useStats";
import { BarList, Donut, InsightCard } from "./viz";

type Stage = "landing" | "form" | "interlude" | "story";
type Saved = { picks: CategoryKey[]; custom?: string | null; at: string };
const SAVED_KEY = "96sar.submitted";

function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
function writeSaved(s: Saved) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(s));
  } catch {
    // private mode
  }
}

export default function PublicExperience() {
  const [stage, setStage] = useState<Stage>("landing");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [fresh, setFresh] = useState(false);
  const [initialStats, setInitialStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    setSaved(readSaved());
    if (window.location.hash === "#results") setStage("story");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [stage]);

  return (
    <div key={stage} className="animate-stage-in">
      {stage === "landing" && <Landing saved={saved} onStart={() => setStage("form")} onResults={() => setStage("story")} />}
      {stage === "form" && (
        <AnswerForm
          onBack={() => setStage("landing")}
          onDone={(s, stats) => {
            writeSaved(s);
            setSaved(s);
            setFresh(true);
            setInitialStats(stats);
            setStage("interlude");
          }}
        />
      )}
      {stage === "interlude" && <Interlude onDone={() => setStage("story")} />}
      {stage === "story" && <Story saved={saved} fresh={fresh} initialStats={initialStats} onShare={() => { setFresh(false); setStage("form"); }} />}
    </div>
  );
}

function Hero96({ size }: { size: "sm" | "lg" }) {
  const { t } = useI18n();
  const lg = size === "lg";
  return (
    <div className={`relative flex items-center justify-center ${lg ? "h-[440px]" : "h-[150px] min-[400px]:h-[170px]"}`}>
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] ${
          lg ? "h-[190px] w-[580px]" : "h-[64px] w-[250px] min-[400px]:w-[290px]"
        }`}
        aria-hidden
      >
        <BrushStroke className="h-full w-full animate-rise [animation-delay:120ms]" />
      </div>
      <Sparkle className={`absolute animate-twinkle ${lg ? "right-[8%] top-[12%] h-11 w-11" : "right-[12%] top-[6%] h-6 w-6"}`} />
      <TwinStar className={`absolute animate-rise [animation-delay:500ms] ${lg ? "bottom-[8%] left-[6%] h-16 w-20" : "bottom-0 left-[4%] h-8 w-10"}`} />
      <div className="relative flex items-end gap-3">
        <span
          dir="ltr"
          className={`num animate-num-in font-display font-extrabold leading-[0.8] tracking-tight text-saudi [animation-delay:180ms] ${
            lg ? "text-[260px]" : "text-[124px] min-[400px]:text-[140px]"
          }`}
        >
          96
        </span>
        <span className={`flex animate-rise flex-col items-start [animation-delay:420ms] ${lg ? "pb-7" : "pb-2.5"}`}>
          <span className={`whitespace-nowrap font-bold text-pine-900 ${lg ? "text-3xl" : "text-base min-[400px]:text-lg"}`}>{t.hero.currency}</span>
          <span className={`block origin-[left_center] animate-draw-x rounded-full bg-gold-500 [animation-delay:600ms] ${lg ? "mt-3 h-1.5 w-16" : "mt-2 h-1 w-9"}`} aria-hidden />
        </span>
      </div>
    </div>
  );
}

function Landing({ saved, onStart, onResults }: { saved: Saved | null; onStart: () => void; onResults: () => void }) {
  const { t } = useI18n();
  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-mist-200">
      <div className="grid-texture pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_65%)]" aria-hidden />
      <HeritageBand className="absolute inset-x-0 bottom-0 h-24 opacity-90 sm:h-40" />

      <BrandHeader />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
        <div className="flex flex-1 flex-col justify-center lg:flex-none">
          <YearMark className="mb-6 animate-rise" />
          <h1 className="mt-2 animate-rise font-display text-[38px] font-bold leading-[1.35] text-ink-900 [animation-delay:80ms] min-[400px]:text-[40px] sm:text-6xl lg:text-[68px] lg:leading-[1.12]">
            {t.hero.titleA} <span className="hl whitespace-nowrap">{t.hero.titleHighlight}</span> {t.hero.titleB}
          </h1>

          <div className="lg:hidden">
            <Hero96 size="sm" />
          </div>

          <p className="max-w-md animate-rise text-base leading-relaxed text-ink-500 [animation-delay:260ms] sm:mt-6 sm:text-xl">{t.hero.sub}</p>

          <div className="mt-7 flex animate-rise flex-col gap-3 [animation-delay:340ms] sm:flex-row sm:items-center">
            <button type="button" onClick={onStart} className="btn-primary group w-full text-[17px] sm:w-auto sm:px-9">
              {t.hero.cta}
              <ArrowIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </button>
          </div>
          <button
            type="button"
            onClick={onResults}
            className="relative z-10 mt-4 animate-rise self-center rounded-full bg-mist-200/85 px-3 py-1 text-[13px] font-semibold text-pine-800 underline decoration-pine-300 underline-offset-4 backdrop-blur-sm transition hover:decoration-pine-700 [animation-delay:420ms] sm:self-start"
          >
            {saved ? t.hero.alreadyShared : t.hero.seeResults}
          </button>
        </div>

        <div className="hidden lg:block">
          <Hero96 size="lg" />
        </div>
      </section>
    </main>
  );
}

function AnswerForm({ onBack, onDone }: { onBack: () => void; onDone: (s: Saved, stats: PublicStats | null) => void }) {
  const { t, lang } = useI18n();
  const [picks, setPicks] = useState<CategoryKey[]>([]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const otherInput = useRef<HTMLInputElement>(null);

  const toggle = (k: CategoryKey) => {
    setError(null);
    setPicks((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
    if (k === "other" && !picks.includes("other")) setTimeout(() => otherInput.current?.focus(), 80);
  };

  async function submit() {
    if (!picks.length) return setError(t.form.pickFirst);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: picks,
          custom: picks.includes("other") ? custom : undefined,
          lang,
          website: honeypot.current?.value ?? "",
        }),
      });
      if (res.status === 429) throw new Error("rate");
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { stats?: PublicStats };
      // keep tap order, the first pick leads the story
      onDone({ picks, custom: picks.includes("other") ? custom.trim() || null : null, at: new Date().toISOString() }, data.stats ?? null);
    } catch (e) {
      setError((e as Error).message === "rate" ? t.form.rateLimited : t.form.error);
      setBusy(false);
    }
  }

  const main = CATEGORY_KEYS.filter((k) => k !== "other");
  const otherOn = picks.includes("other");

  return (
    <main className="min-h-[100svh] bg-mist-200">
      <BrandHeader compact />
      <div className="mx-auto max-w-xl px-5 pb-44 pt-1 sm:px-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="btn-ghost -ms-3 text-sm">
            <BackIcon className="h-4 w-4" /> {t.form.back}
          </button>
        </div>

        <h2 className="mt-4 animate-rise font-display text-[34px] font-bold leading-snug text-ink-900 sm:text-[44px]">
          <span className="hl-teal">{t.form.question}</span>
        </h2>
        <p className="mt-2 animate-rise text-[15px] text-ink-500 [animation-delay:60ms]">{t.form.hint}</p>

        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3" role="group" aria-label={t.form.question}>
          {main.map((k, i) => {
            const on = picks.includes(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(k)}
                style={{ animationDelay: `${100 + i * 40}ms` }}
                className={`group relative flex min-h-[112px] animate-rise flex-col items-start justify-between rounded-2xl border p-4 text-start transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out active:scale-[0.97] ${
                  on
                    ? "border-pine-800 bg-pine-800 text-white shadow-lift"
                    : "border-mist-200 bg-white text-ink-900 hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-soft"
                }`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl transition duration-300 ${
                    on ? "-translate-y-0.5 bg-white/10 text-gold-300" : "bg-mist-100 text-pine-800 group-hover:scale-105 group-hover:bg-pine-50"
                  }`}
                  aria-hidden
                >
                  <CategoryIcon k={k} />
                </span>
                <span className="mt-3 block text-[17px] font-semibold">{CATEGORIES[k].label[lang]}</span>
                <span
                  className={`absolute end-3 top-3 grid h-6 w-6 place-items-center rounded-full transition duration-300 ${
                    on ? "scale-100 bg-gold-500 text-pine-900 opacity-100" : "scale-75 opacity-0"
                  }`}
                  aria-hidden
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}

          <div
            className={`col-span-2 animate-rise overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-300 [animation-delay:340ms] sm:col-span-3 ${
              otherOn ? "border-pine-800 bg-white shadow-lift" : "border-dashed border-mist-300 bg-white hover:border-pine-300"
            }`}
          >
            <button
              type="button"
              aria-pressed={otherOn}
              aria-expanded={otherOn}
              onClick={() => toggle("other")}
              className="flex w-full items-center gap-3 p-4 text-start active:scale-[0.99]"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition duration-300 ${otherOn ? "bg-pine-800 text-gold-300" : "bg-mist-100 text-pine-800"}`} aria-hidden>
                <CategoryIcon k="other" />
              </span>
              <span className="flex-1 text-[17px] font-semibold text-ink-900">{CATEGORIES.other.label[lang]}</span>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full transition duration-300 ${otherOn ? "bg-gold-500 text-pine-900" : "border border-mist-300 text-transparent"}`}
                aria-hidden
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className={`grid transition-all duration-300 ease-out ${otherOn ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="min-h-0">
                <div className="px-4 pb-4">
                  <label htmlFor="custom96" className="sr-only">
                    {t.form.otherLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="custom96"
                      ref={otherInput}
                      value={custom}
                      onChange={(e) => setCustom(e.target.value.slice(0, CUSTOM_MAX))}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      maxLength={CUSTOM_MAX}
                      tabIndex={otherOn ? 0 : -1}
                      placeholder={t.form.otherPlaceholder}
                      enterKeyHint="send"
                      autoComplete="off"
                      className="h-12 w-full rounded-xl border border-mist-300 bg-mist-50 pe-14 ps-4 text-base text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-pine-600 focus:bg-white focus:ring-4 focus:ring-pine-100"
                    />
                    <span className="num pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                      {custom.length}/{CUSTOM_MAX}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-mist-300 bg-mist-200/95 backdrop-blur">
        <div className="mx-auto max-w-xl px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="mb-2 flex h-5 items-center justify-between text-sm">
            <span className={error ? "font-medium text-red-700" : "text-ink-500"} role={error ? "alert" : undefined}>
              {error ?? (picks.length ? t.form.selected(picks.length) : t.form.hint)}
            </span>
            <span className="flex gap-1 text-pine-700" aria-hidden>
              {picks.map((k) => (
                <CategoryIcon key={k} k={k} className="h-5 w-5 animate-pop" />
              ))}
            </span>
          </div>
          <button type="button" onClick={submit} disabled={busy || picks.length === 0} className="btn-primary w-full text-[17px]">
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t.form.submitting}
              </span>
            ) : (
              <>
                {t.form.submit}
                <ArrowIcon />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function Interlude({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const a = setTimeout(() => setStep(1), reduce ? 200 : 750);
    const b = setTimeout(onDone, reduce ? 700 : 2000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [onDone]);
  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-mist-200 px-6 text-center" aria-live="polite">
      <div className="grid-texture pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_50%_45%,black,transparent_60%)]" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[90px] w-[420px] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] opacity-60" aria-hidden>
        <BrushStroke className="h-full w-full animate-rise" />
      </div>
      <p className="relative animate-num-in font-display text-6xl font-bold text-ink-900 sm:text-7xl">
        <span className="hl">{t.done.title}</span>
      </p>
      <p className={`relative mt-5 text-lg text-ink-500 transition-all duration-500 ${step ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>{t.done.sub}</p>
    </main>
  );
}

function Story({ saved, fresh, initialStats, onShare }: { saved: Saved | null; fresh: boolean; initialStats: PublicStats | null; onShare: () => void }) {
  const { t, lang } = useI18n();
  const { stats: live, insight, outside } = useStats(lang, { interval: 6000 });
  const stats = live ?? initialStats;
  const picks = saved?.picks ?? [];
  const revealPicks = picks;

  let hook = "";
  if (picks.length === 1) hook = t.nd.stories[picks[0]].hook;
  else if (picks.length === 2) hook = t.nd.hookTwo(CATEGORIES[picks[0]].al[lang], CATEGORIES[picks[1]].al[lang]);
  else if (picks.length > 2) hook = t.nd.hookMany(CATEGORIES[picks[0]].al[lang], CATEGORIES[picks[1]].al[lang]);

  // toast when someone else submits while you're on the page
  const lastTotal = useRef<number | null>(null);
  const [toast, setToast] = useState(false);
  useEffect(() => {
    if (!stats) return;
    if (lastTotal.current !== null && stats.total > lastTotal.current) {
      setToast(true);
      const id = setTimeout(() => setToast(false), 2600);
      lastTotal.current = stats.total;
      return () => clearTimeout(id);
    }
    lastTotal.current = stats.total;
  }, [stats]);

  return (
    <main className="min-h-[100svh] bg-mist-200">
      <BrandHeader compact />

      <div
        role="status"
        className={`pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center transition-all duration-500 ${toast ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
      >
        <span className="rounded-full bg-pine-900 px-4 py-2 text-sm font-semibold text-white shadow-lift">{t.results.newPick}</span>
      </div>

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {saved && hook && (
          <section className="pb-14 pt-6 sm:pt-10">
            {fresh && (
              <p className="inline-flex animate-pop items-center gap-2 text-sm font-semibold text-pine-700">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-pine-800 text-white">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {t.done.title}
              </p>
            )}
            <div className="mt-6 flex animate-rise items-start gap-4">
              <span className="mt-1 flex shrink-0 -space-x-2 rtl:space-x-reverse" aria-hidden>
                {picks.slice(0, 3).map((k) => (
                  <span key={k} className="grid h-12 w-12 place-items-center rounded-2xl bg-pine-800 text-gold-300 ring-4 ring-white">
                    <CategoryIcon k={k} />
                  </span>
                ))}
              </span>
              <h1 className="font-display text-[32px] font-bold leading-[1.4] text-ink-900 sm:text-5xl">{hook}</h1>
            </div>
            {picks.includes("other") && saved.custom && <p className="mt-4 text-sm text-ink-400">“{saved.custom}”</p>}
          </section>
        )}

        {saved && <div className="rule-dashdot mb-12 opacity-80" aria-hidden />}
        <section className={saved ? "" : "pt-8"}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-pine-800">
              <BarsMark className="h-4 w-2.5 text-pine-800" />
              <span className="hl-teal">{t.nd.campaignBadge}</span>
            </span>
          </div>
          <h2 className="mt-4 font-display text-[30px] font-bold leading-snug text-ink-900 sm:text-[42px]">{t.results.title}</h2>
          <p className="mt-2 text-sm text-ink-500">{t.results.campaignSub}</p>

          {!stats ? (
            <div className="mt-10 space-y-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-mist-100" />
              ))}
            </div>
          ) : stats.total === 0 ? (
            <p className="mt-10 text-lg font-semibold text-pine-900">{t.results.empty}</p>
          ) : (
            <div className="mt-10 grid items-center gap-12 lg:grid-cols-[auto_1fr]">
              <Donut stats={stats} size={200} className="mx-auto hidden lg:block" />
              <BarList stats={stats} limit={5} />
            </div>
          )}

          {stats && stats.total > 0 && outside.any && (
            <div className="mt-12">
              <p className="font-bold text-pine-900">{t.nd.outsideTitle}</p>
              <p className="mt-1 text-sm text-ink-500">{t.nd.outsideSub}</p>
              {outside.themes.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold text-ink-400">{t.nd.outsideThemes}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {outside.themes.map((th) => (
                      <span key={th} className="rounded-full bg-mist-100 px-3 py-1 text-sm font-semibold text-pine-900">
                        {th}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </section>

        <OfficialReveal picks={revealPicks} className="mt-16" />

        <InsightCard insight={insight} stats={stats} className="mt-20" />

        <section className="relative mt-24 overflow-hidden rounded-[28px] bg-pine-900 px-6 py-16 text-center text-white sm:py-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kfu-gate.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-900 via-pine-900/60 to-pine-900/20" aria-hidden />
          <div className="relative">
            <Sparkle className="mx-auto h-6 w-6" />
            <p className="mt-6 font-display text-3xl font-bold leading-snug sm:text-4xl">{t.results.closingA}</p>
            <p className="mt-2 font-display text-3xl font-bold leading-snug sm:text-4xl">
              <span className="hl-teal text-ink-900">{t.results.closingB}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onShare}
            className={
              saved
                ? "relative mt-10 text-sm font-semibold text-white/85 underline decoration-white/30 underline-offset-[6px] transition hover:decoration-white"
                : "btn relative mt-10 h-14 w-full bg-gold-500 text-ink-900 hover:bg-gold-300 sm:w-auto sm:px-10"
            }
          >
            {saved ? t.results.again : t.results.shareYours}
          </button>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
