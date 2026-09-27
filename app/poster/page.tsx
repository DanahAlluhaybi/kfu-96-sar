"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { HeritageBand, KfuLogo, LangToggle, Sparkle, TwinStar } from "@/components/brand";
import { useI18n } from "@/components/I18nProvider";
import { CLUB_HANDLE } from "@/lib/links";

const PAGE_W = 794; // 210mm in css px

export default function Poster() {
  const { t } = useI18n();
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL || "");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!url) setUrl(window.location.origin);
    const fit = () => setScale(Math.min(1, (window.innerWidth - 32) / PAGE_W));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [url]);

  return (
    <main className="min-h-screen bg-ink-700/10 py-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        .poster-page { zoom: var(--s); }
        .receipt-edge { background: radial-gradient(circle at 10px -2px, transparent 10px, #fff 10.5px) -10px 0 / 20px 14px repeat-x; }
        @media print {
          .poster-page { zoom: 1; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto mb-5 flex max-w-[794px] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <div>
          <button type="button" onClick={() => window.print()} className="btn-primary h-12 px-6">
            {t.poster.print}
          </button>
          <p className="mt-2 text-xs text-ink-500">{t.poster.hint}</p>
        </div>
        <LangToggle />
      </div>

      <div className="overflow-hidden">
        <article
          className="poster-page relative mx-auto flex flex-col overflow-hidden bg-mist-200 shadow-lift print:shadow-none"
          style={{ width: "210mm", height: "297mm", ["--s" as string]: scale }}
        >
          <section className="relative h-[560px] shrink-0 overflow-hidden bg-pine-800 px-[56px] pt-[48px] text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "16px 16px" }}
              aria-hidden
            />
            <span
              dir="ltr"
              className="num pointer-events-none absolute -bottom-[70px] end-[-20px] select-none font-display text-[420px] font-extrabold leading-none text-transparent opacity-[0.14]"
              style={{ WebkitTextStroke: "3px #7FC9CE" }}
              aria-hidden
            >
              96
            </span>
            <RisingBars className="absolute end-[56px] top-[200px] h-[170px] w-[240px]" />

            <header className="relative flex items-center justify-between">
              <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-2.5">
                <KfuLogo className="h-[46px] w-auto" />
                <span className="h-9 w-px bg-mist-300" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/club-logo.png" alt={t.brand.club} className="h-[56px] w-auto" />
              </div>
              <div className="flex items-center gap-3" dir="ltr">
                <span className="num text-[15px] font-bold leading-[1.1] text-gold-300">
                  20
                  <br />
                  26
                </span>
                <span className="h-[3px] w-20 bg-pine-400" />
              </div>
            </header>

            <div className="relative mt-[36px] max-w-[410px]">
              <p className="text-[15px] font-bold tracking-wide text-gold-300">{t.wall.kicker}</p>
              <h1 className="mt-3 font-display text-[62px] font-bold leading-[1.18]">
                {t.hero.titleA}
                <br />
                <span className="hl whitespace-nowrap text-ink-900">{t.hero.titleHighlight}</span> {t.hero.titleB}
              </h1>
              <p className="mt-5 max-w-[370px] text-[17px] leading-relaxed text-white/80">{t.poster.sub}</p>
            </div>
            <Sparkle className="absolute end-[300px] top-[120px] h-9 w-9" />
          </section>

          <section className="relative flex flex-1 items-start justify-between gap-[32px] px-[56px]">
            <div className="grid-texture pointer-events-none absolute inset-0 opacity-70" aria-hidden />

            <div className="relative z-10 pt-[34px]">
              <p className="inline-flex rounded-full bg-pine-800 px-6 py-3 font-display text-[24px] font-bold text-white">{t.poster.scan}</p>
              <ol className="mt-7 space-y-4">
                {t.wall.steps.map((s, k) => (
                  <li key={s} className="flex items-center gap-4">
                    <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500 text-[18px] font-bold text-ink-900">{k + 1}</span>
                    <span className="text-[18px] font-semibold leading-snug text-ink-900">{s}</span>
                  </li>
                ))}
              </ol>
              <TwinStar className="mt-8 h-10 w-14" />
            </div>
            <div className="relative z-20 -mt-[150px] w-[300px] shrink-0 drop-shadow-[0_18px_30px_rgba(12,63,65,0.28)]">
              <div className="rounded-t-[18px] bg-white px-[26px] pb-4 pt-[22px]">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[20px] font-bold text-pine-900">{t.poster.receipt}</p>
                  <p className="text-[12px] font-semibold text-ink-400">{t.poster.receiptSub}</p>
                </div>
                <div className="my-4 border-t-2 border-dashed border-mist-300" />
                {url && <QRCodeSVG value={url} size={248} fgColor="#0C3F41" bgColor="#FFFFFF" level="M" style={{ width: 248, height: 248 }} />}
                <div className="my-4 border-t-2 border-dashed border-mist-300" />
                <dl className="space-y-2 text-[15px]">
                  <div className="flex items-baseline gap-2">
                    <dt className="text-ink-500">{t.poster.amount}</dt>
                    <span className="flex-1 border-b-2 border-dotted border-mist-300" />
                    <dd className="num font-bold text-ink-900">{t.poster.amountValue}</dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="text-ink-500">{t.poster.destination}</dt>
                    <span className="flex-1 border-b-2 border-dotted border-mist-300" />
                    <dd className="font-display text-[22px] font-bold leading-none text-gold-600">{t.poster.destinationValue}</dd>
                  </div>
                </dl>
              </div>
              <div className="receipt-edge h-[14px]" aria-hidden />
            </div>

          </section>

          <footer className="relative h-[130px] shrink-0">
            <HeritageBand className="absolute inset-0 h-full" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-[56px] pb-[22px] text-white">
              <div>
                <p className="text-[14px] font-semibold text-white/85">{t.wall.follow}</p>
                <p dir="ltr" className="num text-[24px] font-bold">
                  {CLUB_HANDLE}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/club-logo-white.png" alt="" aria-hidden className="h-[64px] w-auto opacity-95" />
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}

function RisingBars({ className = "" }: { className?: string }) {
  const bars = [52, 78, 66, 104, 128, 150, 184];
  const w = 30;
  const gap = 12;
  const H = 210;
  const pts = bars.map((h, i) => `${i * (w + gap) + w / 2},${H - h - 18}`).join(" ");
  const last = bars.length - 1;
  return (
    <svg viewBox={`0 0 ${bars.length * (w + gap)} ${H}`} className={className} aria-hidden>
      {bars.map((h, i) => (
        <rect key={i} x={i * (w + gap)} y={H - h} width={w} height={h} rx={5} fill={i === last ? "#E7B113" : i % 2 ? "#3AABB1" : "#2A8C92"} opacity={i === last ? 1 : 0.85} />
      ))}
      <polyline points={pts} fill="none" stroke="#F0C84F" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last * (w + gap) + w / 2} cy={H - bars[last] - 18} r={7} fill="#F0C84F" />
    </svg>
  );
}
