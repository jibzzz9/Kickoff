"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type State = { kind: "loading" } | { kind: "invalid" } | { kind: "ready"; name: string } | { kind: "done"; name: string; already?: boolean };

/** Accord parental : le parent arrive depuis l'email et confirme par un clic explicite. */
export default function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations("consent");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void supabase.functions.invoke<{ firstName: string; confirmed: boolean }>("parent-consent", { body: { action: "info", token } }).then(({ data }) => {
      if (!data) return setState({ kind: "invalid" });
      setState(data.confirmed ? { kind: "done", name: data.firstName, already: true } : { kind: "ready", name: data.firstName });
    });
  }, [token, supabase]);

  async function confirm(name: string) {
    setBusy(true);
    const { data } = await supabase.functions.invoke("parent-consent", { body: { action: "confirm", token } });
    setBusy(false);
    setState(data ? { kind: "done", name } : { kind: "invalid" });
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xl font-extrabold">kickoff ↗</p>
      <h1 className="mt-4 text-3xl">{t("title")}</h1>
      {state.kind === "loading" && <p className="mt-6">{t("loading")}</p>}
      {state.kind === "invalid" && <p role="alert" className="mt-6 rounded-card bg-amber/25 p-4">{t("invalid")}</p>}
      {state.kind === "done" && <p role="status" className="mt-6 rounded-card bg-lime p-4 font-bold">{state.already ? t("already") : t("done", { name: state.name })}</p>}
      {state.kind === "ready" && (
        <div className="mt-6 space-y-4 rounded-xl2 bg-white p-6">
          <p>{t("intro", { name: state.name })}</p>
          <p className="font-bold">{t("points")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("p1")}</li><li>{t("p2")}</li><li>{t("p3")}</li><li>{t("p4")}</li>
          </ul>
          <Link href="/legal/privacy" className="block font-bold underline">{t("privacy")}</Link>
          <button disabled={busy} onClick={() => void confirm(state.name)} className="min-h-11 w-full rounded-card bg-lime px-6 py-3 text-lg font-bold disabled:opacity-60">
            {t("confirm")}
          </button>
          <p className="text-sm text-ink/60">{t("refuse")}</p>
        </div>
      )}
    </main>
  );
}
