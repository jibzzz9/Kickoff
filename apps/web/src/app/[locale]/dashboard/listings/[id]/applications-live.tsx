"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Gauge } from "./gauge";
import { DecisionForm, EvaluationForm, InviteForm, NotesPanel } from "./action-forms";
import { Thread } from "./thread";
import { useListingData, type Appointment, type Card, type Evaluation, type Message, type Note, type ScoredMatch } from "./use-listing-data";

type Test = { name: string; score?: number };
type Trial = { professionCode: string; company: string; year: number };
type Ctx = { company: string; listing: string; sender: string };
type Panel = null | "interview" | "trial" | "offer" | "not_this_time" | "waitlist" | "notes" | "thread" | `evaluate:${string}`;

const CLOSED = ["accepted", "declined", "withdrawn", "not_this_time"];

export function ApplicationsLive({ listingId, initial, professionNames, ctx, listingOpen }: {
  listingId: string; initial: Card[]; professionNames: Record<string, string>; ctx: Ctx; listingOpen: boolean;
}) {
  const t = useTranslations();
  const data = useListingData(listingId, initial);
  const [veryFirst, setVeryFirst] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupKind, setGroupKind] = useState<null | "interview" | "trial">(null);

  // Ordre d'arrivée par défaut ; le filtre facultatif remonte les « très intéressants » sans masquer personne.
  const shown = veryFirst
    ? [...data.cards].sort((a, b) => Number(data.scores[b.application_id!]?.badge === "very_interesting") - Number(data.scores[a.application_id!]?.badge === "very_interesting"))
    : data.cards;
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {data.cards.length > 1 && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-5" checked={veryFirst} onChange={(e) => setVeryFirst(e.target.checked)} />
            {t("gauge.filter")}
          </label>
        )}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setGroupKind("interview")} className="min-h-11 rounded-card bg-ink px-4 font-bold text-white">
              {t("actions.groupInvite", { count: selected.size })} · {t("appointment.interview")}
            </button>
            <button onClick={() => setGroupKind("trial")} className="min-h-11 rounded-card border border-ink px-4 font-bold">
              {t("actions.groupInvite", { count: selected.size })} · {t("appointment.trial")}
            </button>
          </div>
        )}
      </div>
      {groupKind && (
        <div className="mb-6 rounded-xl2 bg-white p-5 shadow-sm">
          <h3 className="text-lg">{t("actions.groupTitle", { count: selected.size })}</h3>
          <InviteForm supabase={data.supabase} applicationIds={[...selected]} firstName={null} kind={groupKind} ctx={ctx}
            onCancel={() => setGroupKind(null)} onDone={() => { setGroupKind(null); setSelected(new Set()); void data.refresh(); }} />
        </div>
      )}
      <p aria-live="polite" className={data.newIds.size ? "mb-4 rounded-card bg-lime p-3 font-bold" : "sr-only"}>
        {data.newIds.size ? t("listingPage.newApplication") : ""}
      </p>
      {data.cards.length === 0 ? (
        <p className="rounded-card bg-white p-6">{t("listingPage.noApplications")}</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((c) => {
            const id = c.application_id!;
            return (
              <li key={id}>
                <CandidateCard
                  card={c} isNew={data.newIds.has(id)} professionNames={professionNames} match={data.scores[id]} ctx={ctx} listingOpen={listingOpen}
                  appointments={data.appointments.filter((a) => a.application_id === id)}
                  messages={data.messages.filter((m) => m.application_id === id)}
                  notes={data.notes.filter((n) => n.application_id === id)}
                  evaluations={data.evaluations}
                  selected={selected.has(id)} onToggle={() => toggle(id)}
                  supabase={data.supabase} refresh={data.refresh}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CandidateCard(props: {
  card: Card; isNew: boolean; professionNames: Record<string, string>; match?: ScoredMatch; ctx: Ctx; listingOpen: boolean;
  appointments: Appointment[]; messages: Message[]; notes: Note[]; evaluations: Evaluation[];
  selected: boolean; onToggle: () => void; supabase: ReturnType<typeof useListingData>["supabase"]; refresh: () => Promise<void>;
}) {
  const { card, match, supabase, ctx } = props;
  const t = useTranslations();
  const format = useFormatter();
  const [panel, setPanel] = useState<Panel>(null);
  const id = card.application_id!;
  const average = (card.grades as { average?: number } | null)?.average;
  const tests = (card.aptitude_tests as Test[] | null) ?? [];
  const trials = (card.trial_internships as Trial[] | null) ?? [];
  const closed = CLOSED.includes(card.status ?? "") || !props.listingOpen;
  const done = () => { setPanel(null); void props.refresh(); };
  const fmt = (iso: string) => format.dateTime(new Date(iso), { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  async function openCv() {
    if (!card.cv_path) return;
    // URL signée valable 5 minutes (bucket privé).
    const { data } = await supabase.storage.from("student-documents").createSignedUrl(card.cv_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  const actionBtn = (p: Panel, label: string, primary = false) => (
    <button type="button" onClick={() => setPanel(panel === p ? null : p)} aria-expanded={panel === p}
      className={`min-h-11 rounded-card px-3 text-sm font-bold ${primary ? "bg-lime" : "border border-ink/20 bg-white"} ${panel === p ? "ring-2 ring-violet" : ""}`}>
      {label}
    </button>
  );

  return (
    <article className={`rounded-xl2 bg-white p-5 shadow-sm ${props.isNew ? "ring-2 ring-lime" : ""}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          {!closed && <input type="checkbox" className="size-5" checked={props.selected} onChange={props.onToggle} aria-label={`${t("actions.select")} : ${card.first_name}`} />}
          <h3 className="text-xl">
            {card.first_name}
            {props.isNew && <span className="ml-2 rounded-full bg-lime px-2 py-0.5 align-middle text-xs font-bold">{t("listingPage.new")}</span>}
          </h3>
          <span className="rounded-full bg-surface px-3 py-1 text-sm">{t(`applicationStatus.${card.status}`)}</span>
        </div>
        {card.created_at && <span className="text-sm text-ink/60">{t("candidate.receivedOn", { date: format.dateTime(new Date(card.created_at), { dateStyle: "medium" }) })}</span>}
      </header>
      <p className="mt-1 text-ink/80">
        {[card.age !== null && t("candidate.age", { age: card.age }), card.commune, card.school_year && t("candidate.schoolYear", { year: card.school_year }),
          average !== undefined && t("candidate.average", { value: average })].filter(Boolean).join(" · ")}
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {trials.length > 0 && <div><dt className="font-semibold">{t("candidate.trials")}</dt><dd>{trials.map((tr) => `${props.professionNames[tr.professionCode] ?? tr.professionCode} – ${tr.company} (${tr.year})`).join(", ")}</dd></div>}
        {tests.length > 0 && <div><dt className="font-semibold">{t("candidate.tests")}</dt><dd>{tests.map((x) => (x.score !== undefined ? `${x.name} : ${x.score}` : x.name)).join(", ")}</dd></div>}
        {(card.languages?.length ?? 0) > 0 && <div><dt className="font-semibold">{t("candidate.languages")}</dt><dd>{card.languages!.map((l) => t(`languages.${l}`)).join(", ")}</dd></div>}
        {(card.soft_skills?.length ?? 0) > 0 && <div><dt className="font-semibold">{t("candidate.softSkills")}</dt><dd>{card.soft_skills!.map((s) => t(`softSkills.${s}`)).join(", ")}</dd></div>}
        {(card.has_moped_license || card.does_volunteering) && <div><dd>{[card.has_moped_license && t("candidate.moped"), card.does_volunteering && t("candidate.volunteering")].filter(Boolean).join(" · ")}</dd></div>}
      </dl>

      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">{t("candidate.letter")}</summary>
        <p className="whitespace-pre-line text-sm">{card.cover_letter || t("candidate.noLetter")}</p>
      </details>
      {card.cv_path ? (
        <button onClick={openCv} className="mt-2 min-h-11 rounded-card border border-ink px-4 py-2 font-bold">{t("candidate.cv")}</button>
      ) : (
        <p className="mt-2 text-sm text-ink/60">{t("candidate.noCv")}</p>
      )}

      {props.appointments.length > 0 && (
        <ul className="mt-4 space-y-2">
          {props.appointments.map((a) => {
            const chosen = a.appointment_slots.find((s) => s.id === a.chosen_slot_id);
            const evaluated = props.evaluations.some((e) => e.appointment_id === a.id);
            return (
              <li key={a.id} className="rounded-card border border-ink/10 p-3 text-sm">
                <span className="font-bold">{t(`appointment.${a.kind}`)}</span> · {t(`appointment.status.${a.status}`)}
                <span className="block">
                  {chosen ? t("appointment.chosen", { date: fmt(chosen.starts_at) })
                    : a.status === "proposed" ? `${t("appointment.waiting")} — ${t("appointment.proposed", { slots: a.appointment_slots.map((s) => fmt(s.starts_at)).join(", ") })}` : null}
                </span>
                {a.kind === "trial" && a.status === "scheduled" && !evaluated && (
                  <button onClick={() => setPanel(`evaluate:${a.id}`)} className="mt-2 min-h-11 text-sm font-bold underline">{t("actions.evaluate")}</button>
                )}
                {evaluated && <span className="block text-success">{t("evaluation.saved")}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {match && <Gauge match={match} />}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
        {!closed && card.status !== "offer" && (
          <>
            {actionBtn("interview", t("actions.inviteInterview"), true)}
            {actionBtn("trial", t("actions.inviteTrial"))}
            {actionBtn("offer", t("actions.offer"))}
            {card.status !== "waitlist" && actionBtn("waitlist", t("actions.waitlist"))}
            {actionBtn("not_this_time", t("actions.notThisTime"))}
          </>
        )}
        {actionBtn("thread", `${t("thread.title")} (${props.messages.length})`)}
        {actionBtn("notes", `${t("actions.notes")} (${props.notes.length})`)}
      </div>

      {(panel === "interview" || panel === "trial") && (
        <InviteForm supabase={supabase} applicationIds={[id]} firstName={card.first_name} kind={panel} ctx={ctx} onDone={done} onCancel={() => setPanel(null)} />
      )}
      {(panel === "offer" || panel === "not_this_time" || panel === "waitlist") && (
        <DecisionForm supabase={supabase} applicationId={id} firstName={card.first_name} decision={panel} tipAction={match?.tip ?? null} ctx={ctx} onDone={done} onCancel={() => setPanel(null)} />
      )}
      {panel === "notes" && <NotesPanel supabase={supabase} applicationId={id} notes={props.notes} onDone={() => void props.refresh()} />}
      {panel === "thread" && <Thread supabase={supabase} applicationId={id} messages={props.messages} firstName={card.first_name} onSent={() => void props.refresh()} />}
      {panel?.startsWith("evaluate:") && <EvaluationForm supabase={supabase} appointmentId={panel.slice(9)} onDone={done} />}
    </article>
  );
}
