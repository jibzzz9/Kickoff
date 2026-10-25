"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Info = { firstName: string; relation: "parent" | "teacher"; accepted: boolean };

/** Invitation d'un parent/enseignant : connexion ou création d'un compte parent, puis acceptation. */
export default function GuardianInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations("guardian");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [info, setInfo] = useState<Info | null | "invalid">(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const next = `/guardian/invite/${token}`;

  useEffect(() => {
    void supabase.functions.invoke<Info>("guardian", { body: { action: "info", token } }).then(({ data }) => setInfo(data ?? "invalid"));
    void supabase.auth.getUser().then(({ data }) => setLoggedIn(Boolean(data.user)));
  }, [token, supabase]);

  async function accept() {
    setError(null);
    const { data, error: err } = await supabase.functions.invoke("guardian", { body: { action: "accept", token } });
    if (err || !data) return setError(t("wrongAccount"));
    setDone(true);
    setTimeout(() => router.push("/guardian"), 1200);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xl font-extrabold">kickoff ↗</p>
      <h1 className="mt-4 text-3xl">{t("inviteTitle")}</h1>
      {info === "invalid" && <p role="alert" className="mt-6 rounded-card bg-amber/25 p-4">{t("inviteInvalid")}</p>}
      {info && info !== "invalid" && (
        <div className="mt-6 space-y-4 rounded-xl2 bg-white p-6">
          <p>{t("inviteIntro", { name: info.firstName, relation: t(`relation.${info.relation}`) })}</p>
          <p className="text-sm text-ink/70">{t("readOnly")}</p>
          {done ? (
            <p role="status" className="rounded-card bg-lime p-4 font-bold">{t("accepted", { name: info.firstName })}</p>
          ) : loggedIn ? (
            <button onClick={() => void accept()} className="min-h-11 w-full rounded-card bg-lime px-6 py-3 font-bold">{t("accept")}</button>
          ) : (
            <>
              <p>{t("needAccount")}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/signup?role=parent&next=${encodeURIComponent(next)}`} className="min-h-11 rounded-card bg-lime px-5 py-3 font-bold">{t("createAccount")}</Link>
                <Link href={`/login?next=${encodeURIComponent(next)}`} className="min-h-11 rounded-card border border-ink px-5 py-3 font-bold">{t("login")}</Link>
              </div>
            </>
          )}
          {error && <p role="alert" className="text-coral">{error}</p>}
        </div>
      )}
    </main>
  );
}
