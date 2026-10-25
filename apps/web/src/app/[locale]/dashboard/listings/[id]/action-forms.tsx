"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { messageTemplate, type Lang, type MessageTemplateKind } from "@kickoff/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@kickoff/shared";

type Client = SupabaseClient<Database>;
type Ctx = { company: string; listing: string; sender: string };
const input = "mt-1 min-h-11 w-full rounded-card border border-ink/20 bg-white px-3";

function useSubmit(onDone: () => void) {
  const t = useTranslations("actions");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    const { error: err } = await fn();
    setBusy(false);
    if (err) return setError(err.message.includes("plan_feature_disabled") ? t("planDisabled") : t("error"));
    onDone();
  }
  return { busy, error, run };
}

/** Invitation à un entretien ou à un stage d'essai, pour un ou plusieurs candidats. */
export function InviteForm({
  supabase, applicationIds, firstName, kind, ctx, onDone, onCancel,
}: {
  supabase: Client; applicationIds: string[]; firstName: string | null; kind: "interview" | "trial"; ctx: Ctx; onDone: () => void; onCancel: () => void;
}) {
  const t = useTranslations();
  const lang = useLocale() as Lang;
  const template: MessageTemplateKind = kind === "trial" ? "invitation_trial" : "invitation_interview";
  // Invitation groupée : sans prénom, la salutation reste neutre (« Bonjour, »).
  const [message, setMessage] = useState(() => messageTemplate(lang, template, { firstName, company: ctx.company, sender: ctx.sender }));
  const [slots, setSlots] = useState<string[]>(["", "", ""]);
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState(ctx.sender);
  const [bring, setBring] = useState("");
  const [duration, setDuration] = useState(kind === "trial" ? 480 : 45);
  const { busy, error, run } = useSubmit(onDone);

  return (
    <form
      className="mt-3 space-y-3 rounded-card bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const chosen = slots.filter(Boolean).map((s) => new Date(s).toISOString());
        void run(() =>
          supabase.rpc("company_invite", {
            p_application_ids: applicationIds, p_kind: kind, p_message: message, p_slots: chosen,
            p_location: location || undefined, p_contact_person: contact || undefined, p_what_to_bring: bring || undefined,
            p_duration_minutes: duration,
          }),
        );
      }}
    >
      <label className="block text-sm font-semibold">{t("actions.message")}
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} maxLength={3000} className={`${input} py-2`} />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">{t("actions.slots")}</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {slots.map((s, i) => (
            <input key={i} type="datetime-local" value={s} required={i === 0} aria-label={`${t("actions.slots")} ${i + 1}`}
              onChange={(e) => setSlots((x) => x.map((v, j) => (j === i ? e.target.value : v)))} className={input} />
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">{t("actions.location")}<input value={location} onChange={(e) => setLocation(e.target.value)} className={input} /></label>
        <label className="block text-sm font-semibold">{t("actions.contactPerson")}<input value={contact} onChange={(e) => setContact(e.target.value)} className={input} /></label>
        <label className="block text-sm font-semibold">{t("actions.whatToBring")}<input value={bring} onChange={(e) => setBring(e.target.value)} className={input} /></label>
        <label className="block text-sm font-semibold">{t("actions.duration")}
          <input type="number" min={15} max={600} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={input} />
        </label>
      </div>
      <p className="text-xs text-ink/60">{t("actions.humanNote")}</p>
      {error && <p role="alert" className="text-coral">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className="min-h-11 rounded-card bg-lime px-5 font-bold disabled:opacity-60">{t("actions.send")}</button>
        <button type="button" onClick={onCancel} className="min-h-11 px-4 underline">{t("actions.cancel")}</button>
      </div>
    </form>
  );
}

/** Décision humaine : proposer la place, pas cette fois, liste d'attente. */
export function DecisionForm({
  supabase, applicationId, firstName, decision, tipAction, ctx, onDone, onCancel,
}: {
  supabase: Client; applicationId: string; firstName: string | null; decision: "offer" | "not_this_time" | "waitlist";
  tipAction: string | null; ctx: Ctx; onDone: () => void; onCancel: () => void;
}) {
  const t = useTranslations("actions");
  const lang = useLocale() as Lang;
  const [message, setMessage] = useState(() =>
    messageTemplate(lang, decision, { firstName, company: ctx.company, listing: ctx.listing, sender: ctx.sender, tipAction }),
  );
  const { busy, error, run } = useSubmit(onDone);
  const label = { offer: t("sendOffer"), not_this_time: t("sendNotThisTime"), waitlist: t("sendWaitlist") }[decision];

  return (
    <form
      className="mt-3 space-y-3 rounded-card bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => supabase.rpc("company_decide", { p_application: applicationId, p_decision: decision, p_message: message }));
      }}
    >
      <label className="block text-sm font-semibold">{t("message")}
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={9} maxLength={3000} className={`${input} py-2`} />
      </label>
      <p className="text-xs text-ink/60">{t("humanNote")}</p>
      {error && <p role="alert" className="text-coral">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className="min-h-11 rounded-card bg-lime px-5 font-bold disabled:opacity-60">{label}</button>
        <button type="button" onClick={onCancel} className="min-h-11 px-4 underline">{t("cancel")}</button>
      </div>
    </form>
  );
}

/** Fiche d'évaluation rapide du stage d'essai. */
export function EvaluationForm({ supabase, appointmentId, onDone }: { supabase: Client; appointmentId: string; onDone: () => void }) {
  const t = useTranslations("evaluation");
  const [v, setV] = useState({ punctuality: 3, interest: 3, team: 3 });
  const [comment, setComment] = useState("");
  const [share, setShare] = useState(false);
  const { busy, error, run } = useSubmit(onDone);
  const row = (key: keyof typeof v) => (
    <fieldset className="flex flex-wrap items-center justify-between gap-2">
      <legend className="sr-only">{t(key)}</legend>
      <span aria-hidden className="font-semibold">{t(key)}</span>
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4].map((n) => (
          <label key={n} className={`flex min-h-11 cursor-pointer items-center rounded-full border px-3 text-sm ${v[key] === n ? "border-ink bg-lime" : "border-ink/20 bg-white"}`}>
            <input type="radio" className="sr-only" checked={v[key] === n} onChange={() => setV((s) => ({ ...s, [key]: n }))} />
            {t(`scale.${n}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <form
      className="mt-3 space-y-3 rounded-card bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => supabase.rpc("company_evaluate_trial", {
          p_appointment: appointmentId, p_punctuality: v.punctuality, p_interest: v.interest, p_team_contact: v.team, p_comment: comment, p_share: share,
        }));
      }}
    >
      <h4 className="font-bold">{t("title")}</h4>
      {row("punctuality")}
      {row("interest")}
      {row("team")}
      <label className="block text-sm font-semibold">{t("comment")}
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} className={`${input} py-2`} />
      </label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-5" checked={share} onChange={(e) => setShare(e.target.checked)} />{t("share")}</label>
      {error && <p role="alert" className="text-coral">{error}</p>}
      <button disabled={busy} className="min-h-11 rounded-card bg-lime px-5 font-bold disabled:opacity-60">{t("save")}</button>
    </form>
  );
}

/** Notes privées du formateur (jamais visibles par le jeune). */
export function NotesPanel({ supabase, applicationId, notes, onDone }: { supabase: Client; applicationId: string; notes: { id: string; body: string; created_at: string }[]; onDone: () => void }) {
  const t = useTranslations("notes");
  const [body, setBody] = useState("");
  const { busy, run } = useSubmit(() => {
    setBody("");
    onDone();
  });
  return (
    <div className="mt-3 space-y-2 rounded-card bg-surface p-4">
      {notes.length === 0 ? <p className="text-sm text-ink/60">{t("empty")}</p> : (
        <ul className="space-y-1 text-sm">{notes.map((n) => <li key={n.id}>• {n.body}</li>)}</ul>
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={2000} placeholder={t("placeholder")} aria-label={t("placeholder")} className={`${input} py-2`} />
      <button disabled={busy || !body.trim()} onClick={() => void run(() => supabase.from("recruiter_notes").insert({ application_id: applicationId, body }))}
        className="min-h-11 rounded-card border border-ink px-4 font-bold disabled:opacity-50">{t("add")}</button>
    </div>
  );
}
