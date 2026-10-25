"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loginSchema } from "@kickoff/shared";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

const input = "mt-1 min-h-11 w-full rounded-card border border-ink/20 bg-white px-3";

/** Compte parent / enseignant : il ne donne accès à rien tant qu'un élève ne l'a pas invité. */
export function ParentSignup({ next }: { next: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success || String(raw.password).length < 8 || raw.acceptTerms !== "on") return setError(t("signup.error"));
    setBusy(true);
    const { error: err } = await createClient().auth.signUp({ ...parsed.data, options: { data: { role: "parent", locale } } });
    setBusy(false);
    if (err) return setError(t("signup.error"));
    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl">{t("parentSignup.title")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block"><span className="text-sm font-semibold">{t("common.email")}</span><input name="email" type="email" required autoComplete="email" className={input} /></label>
        <label className="block"><span className="text-sm font-semibold">{t("common.password")}</span><input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} /></label>
        <label className="flex items-start gap-2 text-sm"><input name="acceptTerms" type="checkbox" required className="mt-1 size-5" /><span>{t("signup.acceptTerms")}</span></label>
        <p className="text-sm"><Link href="/legal/terms" className="underline">{t("footer.terms")}</Link> · <Link href="/legal/privacy" className="underline">{t("footer.privacy")}</Link></p>
        {error && <p role="alert" className="text-coral">{error}</p>}
        <button disabled={busy} className="min-h-11 w-full rounded-card bg-lime px-6 py-3 font-bold disabled:opacity-60">{busy ? t("common.loading") : t("parentSignup.submit")}</button>
      </form>
    </main>
  );
}
