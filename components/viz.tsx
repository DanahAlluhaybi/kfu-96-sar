"use client";

import { CATEGORIES } from "@/lib/categories";
import type { CategoryStat, PublicStats } from "@/lib/types";
import { stripEmoji } from "@/lib/text";
import { Sparkle } from "./brand";
import { CategoryIcon } from "./icons";
import { useI18n } from "./I18nProvider";
import { useArmed, useCountUp, useInView } from "./motion";
import type { PublicInsight } from "./useStats";

export function Donut({
  stats,
  size = 220,
  thickness = 22,
  run = true,
  className = "",
}: {
  stats: PublicStats;
  size?: number;
  thickness?: number;
  run?: boolean;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const armed = useArmed(run);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const items = stats.categories.filter((c) => c.count > 0);
  const gap = items.length > 1 ? 4 : 0;
  let offset = 0;
  const top = stats.categories[0];
  const pct = useCountUp(top?.share ?? 0, { run: armed });

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90" role="img" aria-label={t.results.title}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={thickness} />
        {stats.selections > 0 &&
          items.map((c) => {
            const len = (c.count / stats.selections) * C;
            const seg = (
              <circle
                key={c.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={CATEGORIES[c.key].color}
                strokeWidth={thickness}
                strokeDasharray={`${armed ? Math.max(len - gap, 0.001) : 0.001} ${C}`}
                strokeDashoffset={armed ? -offset : 0}
                style={{ transition: "stroke-dasharray 900ms cubic-bezier(.2,.7,.2,1), stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)" }}
              >
                <title>{`${CATEGORIES[c.key].label[lang]} · ${c.share}%`}</title>
              </circle>
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {top && top.count > 0 && (
          <>
            <CategoryIcon k={top.key} className="h-6 w-6 text-pine-600" />
            <span className="num mt-1 text-4xl font-bold leading-none text-pine-900">{pct}%</span>
            <span className="mt-1.5 text-xs font-medium text-ink-500">{CATEGORIES[top.key].label[lang]}</span>
          </>
        )}
      </div>
    </div>
  );
}

function BarRow({ c, max, leader, armed, size, delay }: { c: CategoryStat; max: number; leader: boolean; armed: boolean; size: "md" | "lg"; delay: number }) {
  const { lang, t } = useI18n();
  const meta = CATEGORIES[c.key];
  const pct = useCountUp(c.share, { run: armed, duration: 800 });
  const lg = size === "lg";
  return (
    <li className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-end justify-between gap-3">
        <span className={`flex min-w-0 items-center gap-2.5 font-semibold ${leader ? "text-pine-900" : "text-ink-700"} ${lg ? "text-[28px]" : "text-[15px]"}`}>
          <CategoryIcon k={c.key} className={`${lg ? "h-8 w-8" : "h-[18px] w-[18px]"} shrink-0 ${leader ? "text-pine-700" : "text-ink-400"}`} />
          <span className="truncate">{meta.label[lang]}</span>
          {leader && (
            <span className={`shrink-0 rounded-full bg-gold-50 font-semibold text-gold-700 ${lg ? "px-3 py-1 text-base" : "px-2 py-0.5 text-[10px]"}`}>
              {t.results.topPick}
            </span>
          )}
        </span>
        <span className={`num font-bold leading-none ${leader ? "text-pine-800" : "text-ink-700"} ${lg ? "text-6xl" : "text-xl"}`}>
          {pct}
          <span className={lg ? "text-3xl" : "text-sm"}>%</span>
        </span>
      </div>
      <div className={`mt-2 w-full overflow-hidden rounded-full bg-white/70 ${lg ? "h-3" : "h-2"}`}>
        <div
          className="h-full rounded-full"
          style={{
            width: armed ? `${(c.share / max) * 100}%` : "0%",
            background: leader ? "#11494C" : meta.color,
            opacity: leader ? 1 : 0.75,
            transition: `width 900ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
          }}
        />
      </div>
    </li>
  );
}

export function BarList({ stats, size = "md", limit, run = true }: { stats: PublicStats; size?: "md" | "lg"; limit?: number; run?: boolean }) {
  const armed = useArmed(run);
  const rows = stats.categories.filter((c) => c.count > 0).slice(0, limit ?? 7);
  const max = Math.max(...rows.map((c) => c.share), 1);
  return (
    <ol className={size === "lg" ? "space-y-7" : "space-y-4"}>
      {rows.map((c, i) => (
        <BarRow key={c.key} c={c} max={max} leader={i === 0} armed={armed} size={size} delay={i * 70} />
      ))}
    </ol>
  );
}

export function InsightCard({
  insight,
  stats,
  size = "md",
  tone = "light",
  className = "",
}: {
  insight: PublicInsight;
  stats: PublicStats | null;
  size?: "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
}) {
  const { t } = useI18n();
  const { ref, inView } = useInView<HTMLElement>(0.3);
  const lg = size === "lg";
  const dark = tone === "dark";
  return (
    <section
      ref={ref}
      aria-live="polite"
      className={`relative ${dark ? "overflow-hidden rounded-[28px] bg-pine-900 p-6 text-white lg:p-10" : ""} ${className}`}
    >
      <div className={inView ? "animate-rise" : "opacity-0"}>
        <p className="flex items-center gap-2">
          <Sparkle className={lg ? "h-5 w-5" : "h-4 w-4"} />
          <span className={`font-bold ${dark ? "text-gold-500" : "hl-teal text-ink-900"} ${lg ? "text-xl" : "text-sm"}`}>{t.insight.label}</span>
        </p>
        <p
          key={insight?.text}
          className={`font-display font-bold leading-[1.6] text-balance ${dark ? "text-white" : "text-ink-900"} ${inView ? "animate-rise [animation-delay:200ms]" : ""} ${
            lg ? "mt-5 text-[40px]" : "mt-4 text-[26px] sm:text-[34px]"
          }`}
        >
          {insight?.text ? stripEmoji(insight.text) : stats ? t.insight.waiting : "…"}
        </p>
      </div>
    </section>
  );
}
