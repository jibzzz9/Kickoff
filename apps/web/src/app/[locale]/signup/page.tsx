"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signupCompanySchema } from "@kickoff/shared";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/next-path";
import { useSearchParams } from "next/navigation";
import { ParentSignup } from "./parent-signup";

const input = "mt-1 min-h-11 w-full rounded-card border border-ink/20 bg-white px-3";

export default function SignupPage() {
  const params = useSearchParams();
  if (params.get("role") === "parent") return <ParentSignup next={safeNext(params.get("next"), "/guardian")} />;
  return <CompanySignup />;
}

function CompanySignup() {
  const t = useTranslations("signup");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = signupCompanySchema.safeParse({
      ...raw,
      ideNumber: raw.ideNumber || undefined,
      acceptTerms: raw.acceptTerms === "on",
      locale,
    });
    if (!parsed.success) {
      const key = parsed.error.issues[0]?.message;
      return setError(key === "invalid_ide" ? t("errors.invalid_ide") : t("error"));
    }
    const v = parsed.data;
    setBusy(true);
    // Le trigger SQL handle_new_user crée le profil, l'entreprise et le premier admin.
    const { error } = await createClient().auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        data: {
          role: "company_user",
          locale: v.locale,
          contact_name: v.contactName,
          company_name: v.companyName,
          ide_number: v.ideNumber ?? "",
          commune: v.commune,
        },
      },
    });
    setBusy(false);
    if (error) return setError(t("error"));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl">{t("title")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block"><span className="text-sm font-semibold">{t("contactName")}</span><input name="contactName" required className={input} /></label>
        <label className="block"><span className="text-sm font-semibold">{t("companyName")}</span><input name="companyName" required className={input} /></label>
        <label className="block"><span className="text-sm font-semibold">{t("ideNumber")}</span><input name="ideNumber" className={input} /><span className="text-xs">{t("ideHint")}</span></label>
        <label className="block"><span className="text-sm font-semibold">{t("commune")}</span><input name="commune" required className={input} /></label>
        <label className="block"><span className="text-sm font-semibold">{tc("email")}</span><input name="email" type="email" required autoComplete="email" className={input} /></label>
        <label className="block"><span className="text-sm font-semibold">{tc("password")}</span><input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} /></label>
        <label className="flex items-start gap-2 text-sm"><input name="acceptTerms" type="checkbox" required className="mt-1 size-5" /><span>{t("acceptTerms")}</span></label>
        <p className="text-sm"><Link href="/legal/terms" className="underline">{useTranslations("footer")("terms")}</Link> · <Link href="/legal/privacy" className="underline">{useTranslations("footer")("privacy")}</Link></p>
        {error && <p role="alert" className="text-coral">{error}</p>}
        <button disabled={busy} className="min-h-11 w-full rounded-card bg-lime px-6 py-3 font-bold text-ink disabled:opacity-60">
          {busy ? tc("loading") : t("submit")}
        </button>
      </form>
      <p className="mt-6 text-sm">{t("hasAccount")} <Link href="/login" className="font-bold underline">{useTranslations("home")("login")}</Link></p>
    </main>
  );
}
