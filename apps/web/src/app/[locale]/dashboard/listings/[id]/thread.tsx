"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@kickoff/shared";
import type { Message } from "./use-listing-data";

/** Fil d'échanges avec le jeune : événements + messages libres. */
export function Thread({ supabase, applicationId, messages, firstName, onSent }: {
  supabase: SupabaseClient<Database>; applicationId: string; messages: Message[]; firstName: string | null; onSent: () => void;
}) {
  const t = useTranslations("thread");
  const format = useFormatter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("messages").insert({ application_id: applicationId, sender_role: "company", sender_id: auth.user.id, body: body.trim() });
    setBusy(false);
    if (!error) {
      setBody("");
      onSent();
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-card bg-surface p-4">
      {messages.length === 0 && <p className="text-sm text-ink/60">{t("empty")}</p>}
      <ol className="space-y-2 text-sm">
        {messages.map((m) => (
          <li key={m.id} className={m.sender_role === "student" ? "pr-8" : "pl-8 text-right"}>
            <span className="block text-xs text-ink/50">{format.dateTime(new Date(m.created_at), { dateStyle: "short", timeStyle: "short" })}</span>
            {m.kind !== "text" && <span className="block font-semibold">{t(`events.${m.kind}`, { name: firstName ?? "" })}</span>}
            {m.body && <span className={`inline-block whitespace-pre-line rounded-card px-3 py-2 text-left ${m.sender_role === "student" ? "bg-white" : "bg-violet/10"}`}>{m.body}</span>}
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("placeholder")} aria-label={t("placeholder")} maxLength={5000}
          className="min-h-11 flex-1 rounded-card border border-ink/20 bg-white px-3" />
        <button disabled={busy || !body.trim()} onClick={() => void send()} className="min-h-11 rounded-card bg-ink px-4 font-bold text-white disabled:opacity-50">{t("send")}</button>
      </div>
    </div>
  );
}
