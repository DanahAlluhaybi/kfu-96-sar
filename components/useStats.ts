"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { PublicStats } from "@/lib/types";

export type PublicInsight = { text: string; lang: Lang; at: string } | null;
export type Outside = { any: boolean; themes: string[] };

export function useStats(lang: Lang, { interval = 8000, enabled = true } = {}) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [insight, setInsight] = useState<PublicInsight>(null);
  const [outside, setOutside] = useState<Outside>({ any: false, themes: [] });
  const [error, setError] = useState(false);
  const langRef = useRef(lang);
  langRef.current = lang;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?lang=${langRef.current}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { stats: PublicStats; insight: PublicInsight; outside?: Outside };
      setStats(data.stats);
      setOutside(data.outside ?? { any: false, themes: [] });
      setInsight(data.insight && data.insight.lang === langRef.current ? data.insight : null);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, interval);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, interval, lang, load]);

  return { stats, insight, outside, error, reload: load, setStats };
}
