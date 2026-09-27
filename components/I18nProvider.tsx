"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DICT, dirOf, LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n";

type Ctx = { lang: Lang; t: Dict; dir: "rtl" | "ltr"; setLang: (l: Lang) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    document.documentElement.dir = dirOf(l);
    document.title = DICT[l].meta.title;
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, t: DICT[lang], dir: dirOf(lang), setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
