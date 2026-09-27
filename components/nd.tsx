"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryKey } from "@/lib/categories";
import { pickRevealStats, sortStats, type NdStat } from "@/lib/nd";
import { Sparkle, TwinStar } from "./brand";
import { useI18n } from "./I18nProvider";
import { useInView } from "./motion";

export function useNdStats() {
  const [stats, setStats] = useState<NdStat[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/nd-data", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { stats: [] }))
      .then((d: { stats: NdStat[] }) => alive && setStats(d.stats))
      .catch(() => alive && setStats([]));
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}

function useDate() {
  const { lang } = useI18n();
  return useMemo(() => {
    const f = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return (d: string) => f.format(new Date(`${d}T00:00:00Z`));
  }, [lang]);
}

export function PeriodTag({ s, onDark = false }: { s: NdStat; onDark?: boolean }) {
  const { t, lang } = useI18n();
  if (s.national_day_specific) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${onDark ? "text-gold-300" : "text-gold-700"}`}>
        <Sparkle className="h-3 w-3" />
        {t.nd.ndSpecific}
      </span>
    );
  }
  return <span className={`text-xs font-semibold ${onDark ? "text-white/70" : "text-ink-500"}`}>{s.period_label[lang]}</span>;
}

export function SourceLine({ s, onDark = false }: { s: NdStat; onDark?: boolean }) {
  const { t, lang } = useI18n();
  const date = useDate();
  return (
    <p className={`text-[11px] leading-relaxed ${onDark ? "text-white/55" : "text-ink-400"}`}>
      {t.nd.source}:{" "}
      <a
        href={s.source_url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${s.period_label[lang]} · ${date(s.published_at)}`}
        className={`font-semibold underline decoration-dotted underline-offset-4 transition hover:decoration-solid ${onDark ? "text-white/80" : "text-ink-700"}`}
      >
        {s.source_org[lang]}
      </a>

    </p>
  );
}

function Figure({ s, go, secondary = false, delay }: { s: NdStat; go: boolean; secondary?: boolean; delay?: number }) {
  const { lang } = useI18n();
  const d = delay ?? (secondary ? 250 : 0);
  const hide = go ? "" : "opacity-0";
  return (
    <div>
      <p
        className={`num font-bold leading-[0.95] tracking-tight text-gold-500 ${secondary ? "text-[40px] sm:text-5xl" : "text-[52px] min-[400px]:text-[58px] sm:text-[88px]"} ${
          go ? "animate-num-in" : "opacity-0"
        }`}
        style={{ animationDelay: `${d + 350}ms` }}
        dir="auto"
      >
        {s.display[lang]}
      </p>
      <p
        className={`mt-3 max-w-md font-semibold leading-snug text-white ${secondary ? "text-base" : "text-lg sm:text-xl"} ${go ? "animate-rise" : hide}`}
        style={{ animationDelay: `${d + 650}ms` }}
      >
        {s.stat[lang]}
      </p>
      {s.connect && !secondary && (
        <p className={`mt-4 text-[15px] leading-relaxed text-pine-200 ${go ? "animate-rise" : hide}`} style={{ animationDelay: `${d + 900}ms` }}>
          {s.connect[lang]}
        </p>
      )}
      <div className={`mt-5 ${go ? "animate-rise" : hide}`} style={{ animationDelay: `${d + 1100}ms` }}>
        <SourceLine s={s} onDark />
      </div>
    </div>
  );
}

export function OfficialReveal({ picks, className = "" }: { picks: CategoryKey[]; className?: string }) {
  const { t } = useI18n();
  const all = useNdStats();
  const { ref, inView } = useInView<HTMLElement>(0.3);
  const shown = all ? pickRevealStats(all, picks) : null;
  const go = inView && !!shown;

  return (
    <section ref={ref} className={`relative overflow-hidden rounded-[28px] bg-pine-800 px-6 py-10 text-white sm:px-10 sm:py-14 ${className}`}>
      <TwinStar className="pointer-events-none absolute -end-4 bottom-6 h-16 w-20 opacity-40" />
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gold-500" aria-hidden />
      <div className={inView ? "animate-rise" : "opacity-0"}>
        <p className="inline-flex items-center gap-2 text-xs font-bold text-gold-300">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M8 1 2.5 3.2v4.1c0 3.4 2.3 6.3 5.5 7.2 3.2-.9 5.5-3.8 5.5-7.2V3.2L8 1Z" fill="currentColor" />
          </svg>
          {t.nd.sectionKicker}
        </p>
        <h2 className="mt-3 font-display text-[30px] font-bold leading-snug text-white sm:text-[42px]">{t.nd.sectionTitle}</h2>
      </div>

      <div className="mt-8 min-h-[220px]">
        {!shown ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white/10" />
        ) : shown.length === 0 ? (
          <p className="text-sm text-white/70">{t.nd.noStat}</p>
        ) : (
          <div className="space-y-10">
            <Figure s={shown[0]} go={go} />
            {shown.length > 1 && (
              <div className="grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-2">
                {shown.slice(1).map((s, i) => (
                  <Figure key={s.id} s={s} go={go} secondary delay={250 + i * 200} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </section>
  );
}

// so the wall doesn't open on the same figure every time the scene comes back
let rotatorMounts = 0;

export function NdFactRotator({ intervalMs = 8000, compact = false }: { intervalMs?: number; compact?: boolean }) {
  const { t, lang } = useI18n();
  const all = useNdStats();
  const list = all ? sortStats(all.filter((s) => s.status === "active")) : [];
  const [i, setI] = useState(() => rotatorMounts++);
  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % list.length), intervalMs);
    return () => clearInterval(id);
  }, [list.length, intervalMs]);
  const s = list[i % Math.max(list.length, 1)];
  const more = !compact && list.length > 1 ? [1, 2].map((o) => list[(i + o) % list.length]).filter((x, j, arr) => x.id !== s?.id && arr.findIndex((y) => y.id === x.id) === j) : [];

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] bg-pine-800 p-6 text-white lg:p-10">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gold-500" aria-hidden />
      <p className="text-base font-bold text-gold-300 lg:text-lg">{t.nd.sectionKicker}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white lg:text-3xl">{t.nd.sectionTitle}</p>
      {s ? (
        <div key={`${s.id}-${lang}`} className="mt-8">
          <div className="animate-rise">
            <PeriodTag s={s} onDark />
          </div>
          <p className={`num mt-3 animate-num-in font-bold ${compact ? "text-[48px] lg:text-[64px]" : "text-[56px] lg:text-[96px]"} leading-[0.95] tracking-tight text-gold-500 [animation-delay:150ms]`} dir="auto">
            {s.display[lang]}
          </p>
          <p className="mt-4 max-w-xl animate-rise text-lg lg:text-2xl font-semibold leading-snug text-white [animation-delay:350ms]">{s.stat[lang]}</p>
          <p className="mt-5 animate-rise text-base text-white/60 [animation-delay:500ms]">
            {t.nd.source}: <span className="font-semibold text-white/85">{s.source_org[lang]}</span>
          </p>
          {more.length > 0 && (
            <div className="mt-6 grid gap-5 border-t border-white/15 pt-5 sm:grid-cols-2">
              {more.map((m, j) => (
                <div key={m.id} className="animate-rise" style={{ animationDelay: `${650 + j * 150}ms` }}>
                  <p className="num text-3xl font-bold leading-none text-gold-300 lg:text-4xl" dir="auto">
                    {m.display[lang]}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white/85 lg:text-base">{m.stat[lang]}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {t.nd.source}: {m.source_org[lang]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/10" />
      )}
    </div>
  );
}
