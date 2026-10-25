"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { loginSchema } from "@kickoff/shared";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/next-path";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"), "/dashboard");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(t("login.error"));
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return setError(t("login.error"));
    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl">{t("login.title")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">{t("common.email")}</span>
          <input name="email" type="email" required autoComplete="email" className="mt-1 min-h-11 w-full rounded-card border border-ink/20 bg-white px-3" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{t("common.password")}</span>
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-card border border-ink/20 bg-white px-3" />
        </label>
        {error && <p role="alert" className="text-coral">{error}</p>}
        <button disabled={busy} className="min-h-11 w-full rounded-card bg-lime px-6 py-3 font-bold text-ink disabled:opacity-60">
          {busy ? t("common.loading") : t("login.submit")}
        </button>
      </form>
      <p className="mt-6 text-sm">{t("login.noAccount")} <Link href="/signup" className="font-bold underline">{t("home.signup")}</Link></p>
    </main>
  );
}
