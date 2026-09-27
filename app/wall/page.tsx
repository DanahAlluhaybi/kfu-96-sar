"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarsMark, BrandLockup, BrushStroke, HeritageBand, LangToggle, Sparkle, TwinStar } from "@/components/brand";
import { useI18n } from "@/components/I18nProvider";
import { NdFactRotator } from "@/components/nd";
import { useStats } from "@/components/useStats";
import { BarList, InsightCard } from "@/components/viz";
import { CLUB_HANDLE } from "@/lib/links";

// booth screen. ?rotate=1 flips ar/en every 20s, arrow keys switch scenes
const SCENE_MS = 12_000;
type Scene = "intro" | "picks" | "official" | "takeaway";
const SCENE_INDEX = { intro: 0, picks: 1, official: 2, takeaway: 3 } as const;

export default function Wall() {
  const { t, lang, setLang } = useI18n();
  const { stats, insight } = useStats(lang, { interval: 4000 });
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL || "");

  useEffect(() => {
    if (!url) setUrl(window.location.origin);
    const rotate = new URLSearchParams(window.location.search).get("rotate") === "1";
    if (!rotate) return;
    const id = setInterval(() => setLang(document.documentElement.lang === "ar" ? "en" : "ar"), 20_000);
    return () => clearInterval(id);
  }, [setLang, url]);

  const scenes = useMemo<Scene[]>(() => {
    const s: Scene[] = ["intro", "picks", "official"];
    if (insight?.text) s.push("takeaway");
    return s;
  }, [insight?.text]);
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0); // bump to restart the timer after a manual switch
  const go = useCallback(
    (d: number) => {
      setI((x) => (((x + d) % scenes.length) + scenes.length) % scenes.length);
      setTick((x) => x + 1);
    },
    [scenes.length],
  );
  const cur = i % scenes.length;
  const scene = scenes[cur];

  useEffect(() => {
    const id = setTimeout(() => go(1), SCENE_MS);
    return () => clearTimeout(id);
  }, [i, tick, go]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const last = useRef<number | null>(null);
  const [toast, setToast] = useState(false);
  useEffect(() => {
    if (!stats) return;
    if (last.current !== null && stats.total > last.current) {
      setToast(true);
      const id = setTimeout(() => setToast(false), 3000);
      last.current = stats.total;
      return () => clearTimeout(id);
    }
    last.current = stats.total;
  }, [stats]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-mist-200">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <HeritageBand className="absolute inset-x-0 bottom-0 h-20 opacity-60 lg:h-32" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-5 pt-6 lg:px-12 lg:pt-8">
        <span className="lg:hidden">
          <BrandLockup size="sm" />
        </span>
        <span className="hidden lg:block">
          <BrandLockup size="lg" />
        </span>
        <div className="flex items-center gap-3 lg:gap-6">
          <span
            className={`hidden rounded-full bg-pine-900 px-5 py-2.5 text-lg font-semibold text-white transition-all duration-500 lg:inline ${toast ? "opacity-100" : "opacity-0"}`}
          >
            {t.results.newPick}
          </span>
          <LangToggle />
        </div>
      </header>

      <div className="relative z-10 grid flex-1 grid-cols-1 gap-6 px-5 pb-28 pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:px-12 lg:pb-36 lg:pt-8">
        <section className="flex min-w-0 flex-col">
          <div key={`${scene}-${lang}`} className="flex-1 animate-stage-in">
            {scene === "intro" && <Intro />}
            {scene === "picks" && (
              <div className="h-full rounded-[28px] bg-white/80 p-6 lg:p-12">
                <p className="flex items-center gap-2 text-lg font-bold text-pine-800 lg:text-2xl">
                  <BarsMark className="h-5 w-3 text-pine-800" />
                  <span className="hl-teal text-ink-900">{t.nd.campaignBadge}</span>
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 lg:text-6xl">{t.results.title}</h2>
                <div className="mt-8 lg:mt-12">
                  {stats && stats.total > 0 ? (
                    <>
                      <div className="lg:hidden">
                        <BarList stats={stats} limit={5} />
                      </div>
                      <div className="hidden lg:block">
                        <BarList stats={stats} size="lg" limit={5} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xl font-semibold text-pine-900 lg:text-3xl">{t.results.empty}</p>
                  )}
                </div>
              </div>
            )}
            {scene === "official" && <NdFactRotator />}
            {scene === "takeaway" && (
              <>
                <div className="lg:hidden">
                  <InsightCard insight={insight} stats={stats} tone="dark" />
                </div>
                <div className="hidden h-full lg:block">
                  <InsightCard insight={insight} stats={stats} size="lg" tone="dark" className="flex h-full flex-col justify-center" />
                </div>
              </>
            )}
          </div>

          <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="scenes">
            {scenes.map((s, k) => {
              const on = k === cur;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setI(k);
                    setTick((x) => x + 1);
                  }}
                  className="group min-w-[88px] text-start"
                >
                  <span className={`block text-xs font-bold transition lg:text-sm ${on ? "text-pine-900" : "text-ink-400 group-hover:text-pine-700"}`}>
                    {t.wall.scenes[SCENE_INDEX[s]]}
                  </span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-mist-300">
                    {on && (
                      <span
                        key={`${i}-${tick}`}
                        className="block h-full origin-[left_center] animate-draw-x rounded-full bg-gold-500 rtl:origin-[right_center]"
                        style={{ animationDuration: `${SCENE_MS}ms`, animationTimingFunction: "linear" }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </section>

        <aside className="flex flex-col items-center rounded-[28px] bg-pine-800 p-6 text-center text-white lg:justify-center lg:p-8">
          <p className="font-display text-2xl font-bold leading-snug lg:text-3xl">{t.wall.scan}</p>
          <p className="mt-1 text-sm text-white/70 lg:text-base">{t.wall.scanSub}</p>
          <div className="mt-5 rounded-3xl bg-white p-3 shadow-lift lg:mt-7 lg:p-4">
            {url && <QRCodeSVG className="h-40 w-40 lg:h-[240px] lg:w-[240px]" value={url} size={240} fgColor="#0C3F41" bgColor="#FFFFFF" level="M" />}
          </div>
          <div className="mt-6 w-full border-t border-white/15 pt-5">
            <p className="text-xs text-white/60 lg:text-sm">{t.wall.follow}</p>
            <p dir="ltr" className="num mt-1 text-lg font-bold lg:text-xl">
              {CLUB_HANDLE}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Intro() {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col justify-center gap-8 lg:gap-10">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
        <div className="min-w-0">
          <p className="eyebrow">{t.wall.kicker}</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.3] text-ink-900 lg:text-6xl lg:leading-[1.2] 2xl:text-7xl">
            {t.hero.titleA} <span className="hl whitespace-nowrap">{t.hero.titleHighlight}</span> {t.hero.titleB}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-700 lg:text-xl 2xl:text-2xl">{t.wall.about}</p>
        </div>

        <div className="relative hidden h-[230px] w-[340px] items-center justify-center lg:flex 2xl:h-[280px] 2xl:w-[420px]">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[110px] -translate-y-1/2 -rotate-[14deg]" aria-hidden>
            <BrushStroke className="h-full w-full" />
          </div>
          <Sparkle className="absolute end-[6%] top-[4%] h-10 w-10 animate-twinkle" />
          <TwinStar className="absolute bottom-[2%] start-[4%] h-12 w-16" />
          <span dir="ltr" className="num relative font-display text-[190px] font-extrabold leading-none tracking-tight text-saudi 2xl:text-[230px]">
            96
          </span>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-pine-800 lg:text-lg">{t.wall.stepsTitle}</p>
        <ol className="mt-3 grid gap-3 md:grid-cols-3 lg:gap-4">
          {t.wall.steps.map((s, k) => (
            <li key={s} className="flex items-center gap-4 rounded-2xl bg-white/85 p-4 lg:p-5">
              <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500 text-lg font-bold text-ink-900 lg:h-12 lg:w-12 lg:text-xl">
                {k + 1}
              </span>
              <span className="text-base font-semibold leading-snug text-ink-900 lg:text-lg">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
