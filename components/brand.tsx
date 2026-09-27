"use client";

import { CLUB_HANDLE, LINKTREE, SOCIALS } from "@/lib/links";
import { useI18n } from "./I18nProvider";

export function KfuLogo({ className = "h-10 w-auto", seal = false }: { className?: string; seal?: boolean }) {
  const { t } = useI18n();
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={seal ? "/brand/kfu-seal.png" : "/brand/kfu-logo.png"} alt={t.brand.logoAlt} className={className} />;
}

export function BrandLockup({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { t } = useI18n();
  const h = size === "lg" ? "h-20" : size === "sm" ? "h-9" : "h-10 sm:h-14";
  const hc = size === "lg" ? "h-24" : size === "sm" ? "h-11" : "h-14 sm:h-[72px]";
  return (
    <div className={`flex items-center gap-3 sm:gap-5 ${className}`}>
      <KfuLogo className={`${h} w-auto shrink-0`} />
      <span className={`w-px self-stretch bg-mist-300 ${size === "lg" ? "my-2" : "my-1"}`} aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/club-logo.png" alt={t.brand.club} className={`${hc} w-auto shrink-0`} />
    </div>
  );
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const item = (l: "ar" | "en", label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      lang={l}
      className={`h-8 min-w-[3rem] rounded-lg px-3 text-sm font-semibold transition ${
        lang === l ? "bg-pine-800 text-white shadow-sm" : "text-pine-800 hover:bg-pine-50"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={t.lang.switchTo}
      className={`inline-flex items-center gap-0.5 rounded-xl border border-mist-200 bg-white/90 p-1 backdrop-blur ${className}`}
      dir="ltr"
    >
      {item("ar", t.lang.ar)}
      <span className="h-4 w-px bg-mist-300" aria-hidden />
      {item("en", t.lang.en)}
    </div>
  );
}

export function Sparkle({ className = "h-6 w-6", color = "#E7B113" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 0c.7 6.3 5 10.6 12 12-7 1.4-11.3 5.7-12 12-.7-6.3-5-10.6-12-12C7 10.6 11.3 6.3 12 0Z" fill={color} />
    </svg>
  );
}

export function BrushStroke({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="brush96" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3AABB1" stopOpacity="0" />
          <stop offset="0.18" stopColor="#3AABB1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3AABB1" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M6 78C80 70 220 48 394 22c4-.6 6 16 1 18C230 64 92 96 8 104c-6 .6-8-25-2-26Z" fill="url(#brush96)" />
    </svg>
  );
}

export function BarsMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 40" className={className} aria-hidden>
      {[0, 6, 11, 16, 21, 26, 31, 36].map((y, i) => (
        <rect key={y} x="0" y={y} width="24" height={i % 3 === 0 ? 3 : 2} rx="0.5" fill="currentColor" />
      ))}
    </svg>
  );
}

export function BrandHeader({ end, compact = false }: { end?: React.ReactNode; compact?: boolean; masthead?: boolean }) {
  return (
    <header className="relative z-20 w-full">
      <div className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 sm:px-8 ${compact ? "h-20" : "h-24 sm:h-28"}`}>
        <BrandLockup />
        <div className="flex items-center gap-2">
          {end}
          <LangToggle />
        </div>
      </div>
    </header>
  );
}

const SOCIAL_ICONS: Record<keyof typeof SOCIALS, { label: string; path: React.ReactNode }> = {
  tiktok: {
    label: "TikTok",
    path: <path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46M14 4c.4 2.3 2 3.9 4.5 4" />,
  },
  x: { label: "X", path: <path d="M5 5l14 14M19 5 5 19" /> },
  linkedin: {
    label: "LinkedIn",
    path: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8.5 10.5V16M8.5 8h.01M12 16v-5.5M12 13c0-1.5 1-2.5 2.3-2.5S16 11.3 16 13v3" />
      </>
    ),
  },
  linktree: {
    label: "Linktree",
    path: <path d="M12 21v-8M5 9.5h14M7.2 5.2 12 9.5l4.8-4.3M7.2 13.8 12 9.5l4.8 4.3" />,
  },
};

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-mist-200 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <BrandLockup size="sm" />
        <div>
          <div className="flex items-center gap-4">
            <a href={LINKTREE} target="_blank" rel="noopener noreferrer" className="num text-sm font-bold text-pine-900 transition hover:text-pine-600" dir="ltr">
              {CLUB_HANDLE}
            </a>
            <ul className="flex items-center gap-1">
              {(Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[]).map((k) => (
                <li key={k}>
                  <a
                    href={SOCIALS[k]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_ICONS[k].label}
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-400 transition duration-300 hover:bg-pine-50 hover:text-pine-800"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {SOCIAL_ICONS[k].path}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function TwinStar({ className = "h-10 w-16", color = "#3AABB1" }: { className?: string; color?: string }) {
  const star = (cx: number) => `M${cx} 0Q${cx} 50 ${cx + 30} 50Q${cx} 50 ${cx} 100Q${cx} 50 ${cx - 30} 50Q${cx} 50 ${cx} 0Z`;
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <path d={star(40)} fill={color} />
      <path d={star(80)} fill={color} />
    </svg>
  );
}

export function YearMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} dir="ltr" aria-hidden>
      <span className="num text-[13px] font-bold leading-[1.15] text-pine-800">
        20
        <br />
        26
      </span>
      <span className="rule-teal w-16 sm:w-24" />
    </div>
  );
}

// jabal al-qarah strip from the visual identity
export function HeritageBand({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/qarah-band.jpg"
      alt=""
      aria-hidden
      className={`pointer-events-none w-full select-none object-cover ${flip ? "rotate-180" : ""} ${className}`}
      style={{ maskImage: "linear-gradient(to bottom, transparent, black 45%)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 45%)" }}
    />
  );
}
