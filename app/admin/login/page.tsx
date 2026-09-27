"use client";

import { useState } from "react";
import { BrandLockup, LangToggle, Sparkle } from "@/components/brand";
import { useI18n } from "@/components/I18nProvider";
import { LockIcon } from "@/components/icons";

export default function AdminLogin() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.href = "/admin";
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        res.status === 429
          ? t.admin.tooMany
          : data.error === "not_configured"
            ? "ADMIN_PASSWORD / ADMIN_SESSION_SECRET not configured on the server."
            : t.admin.badCreds,
      );
    } catch {
      setError(t.form.error);
    }
    setBusy(false);
  }

  const input =
    "h-12 w-full rounded-xl border border-mist-300 bg-white px-4 text-base outline-none transition focus:border-pine-600 focus:ring-4 focus:ring-pine-100";

  return (
    <main className="grid min-h-screen bg-mist-50 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-pine-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-texture absolute inset-0 opacity-30 mix-blend-screen" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="rounded-xl bg-white px-4 py-3">
            <BrandLockup size="sm" />
          </span>
        </div>
        <div className="relative">
          <Sparkle className="h-10 w-10" />
          <p className="mt-6 text-5xl font-bold leading-tight">
            {t.hero.titleA} <span className="text-gold-500">{t.hero.titleHighlight}</span> {t.hero.titleB}
          </p>
          <p className="mt-4 text-white/70">{t.brand.event} · {t.brand.university}</p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <BrandLockup size="sm" className="lg:invisible" />
          <LangToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <form onSubmit={submit} className="card w-full max-w-sm p-7 shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-50 text-pine-800">
              <LockIcon className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-pine-900">{t.admin.signInTitle}</h1>
            <p className="mt-1 text-sm text-ink-500">{t.admin.signInSub}</p>

            <label className="mt-6 block text-sm font-semibold text-ink-700" htmlFor="u">
              {t.admin.username}
            </label>
            <input id="u" className={`${input} mt-1.5`} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required dir="ltr" />

            <label className="mt-4 block text-sm font-semibold text-ink-700" htmlFor="p">
              {t.admin.password}
            </label>
            <input id="p" type="password" className={`${input} mt-1.5`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required dir="ltr" />

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary mt-6 h-12 w-full">
              {busy ? t.admin.signingIn : t.admin.signIn}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
