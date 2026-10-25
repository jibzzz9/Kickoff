"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { Database } from "@kickoff/shared";
import { createClient } from "@/lib/supabase/client";
import { Gauge, type CompanyMatch } from "./gauge";

type Card = Database["public"]["Views"]["candidate_cards"]["Row"];
type LiveCard = Card & { isNew?: boolean };

type Test = { name: string; score?: number };
type Trial = { professionCode: string; company: string; year: number };

export function ApplicationsLive({
  listingId,
  initial,
  professionNames,
}: {
  listingId: string;
  initial: Card[];
  professionNames: Record<string, string>;
}) {
  const t = useTranslations();
  const [cards, setCards] = useState<LiveCard[]>(initial);
  const [announce, setAnnounce] = useState(false);
  const [scores, setScores] = useState<Record<string, CompanyMatch>>({});
  const [veryFirst, setVeryFirst] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Jauge : calculée côté serveur (Edge Function `match`), jamais dans le navigateur.
  const refreshScores = useCallback(async () => {
    const { data } = await supabase.functions.invoke<{ results: Record<string, CompanyMatch> }>("match", {
      body: { action: "score", listingId },
    });
    if (data?.results) setScores(data.results);
  }, [listingId, supabase]);

  useEffect(() => {
    void refreshScores();
  }, [refreshScores]);

  useEffect(() => {
    // Temps réel : chaque nouvelle candidature sur cette annonce est ajoutée en bas de la liste (ordre d'arrivée).
    const channel = supabase
      .channel(`applications-${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications", filter: `listing_id=eq.${listingId}` },
        async (payload) => {
          const { data } = await supabase
            .from("candidate_cards")
            .select("*")
            .eq("application_id", (payload.new as { id: string }).id)
            .maybeSingle();
          if (!data) return;
          setCards((s) => (s.some((c) => c.application_id === data.application_id) ? s : [...s, { ...data, isNew: true }]));
          setAnnounce(true);
          void refreshScores();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, supabase, refreshScores]);

  // Ordre d'arrivée par défaut ; le filtre facultatif remonte les « très intéressants » sans masquer personne.
  const shown = veryFirst
    ? [...cards].sort((a, b) => Number(scores[b.application_id!]?.badge === "very_interesting") - Number(scores[a.application_id!]?.badge === "very_interesting"))
    : cards;

  return (
    <div className="mt-4">
      {cards.length > 1 && (
        <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-5" checked={veryFirst} onChange={(e) => setVeryFirst(e.target.checked)} />
          {t("gauge.filter")}
        </label>
      )}
      <p aria-live="polite" className={announce ? "mb-4 rounded-card bg-lime p-3 font-bold" : "sr-only"}>
        {announce ? t("listingPage.newApplication") : ""}
      </p>
      {cards.length === 0 ? (
        <p className="rounded-card bg-white p-6">{t("listingPage.noApplications")}</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((c) => (
            <li key={c.application_id}>
              <CandidateCard card={c} professionNames={professionNames} match={scores[c.application_id!]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CandidateCard({ card, professionNames, match }: { card: LiveCard; professionNames: Record<string, string>; match?: CompanyMatch }) {
  const t = useTranslations();
  const format = useFormatter();
  const supabase = useMemo(() => createClient(), []);
  const average = (card.grades as { average?: number } | null)?.average;
  const tests = (card.aptitude_tests as Test[] | null) ?? [];
  const trials = (card.trial_internships as Trial[] | null) ?? [];

  async function openCv() {
    if (!card.cv_path) return;
    // URL signée valable 5 minutes (bucket privé).
    const { data } = await supabase.storage.from("student-documents").createSignedUrl(card.cv_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <article className={`rounded-xl2 bg-white p-5 shadow-sm ${card.isNew ? "ring-2 ring-lime" : ""}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl">
          {card.first_name}
          {card.isNew && <span className="ml-2 rounded-full bg-lime px-2 py-0.5 align-middle text-xs font-bold">{t("listingPage.new")}</span>}
        </h3>
        {card.created_at && (
          <span className="text-sm text-ink/60">{t("candidate.receivedOn", { date: format.dateTime(new Date(card.created_at), { dateStyle: "medium" }) })}</span>
        )}
      </header>
      <p className="mt-1 text-ink/80">
        {[
          card.age !== null && t("candidate.age", { age: card.age }),
          card.commune,
          card.school_year && t("candidate.schoolYear", { year: card.school_year }),
          average !== undefined && t("candidate.average", { value: average }),
        ].filter(Boolean).join(" · ")}
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {trials.length > 0 && (
          <div>
            <dt className="font-semibold">{t("candidate.trials")}</dt>
            <dd>{trials.map((tr) => `${professionNames[tr.professionCode] ?? tr.professionCode} – ${tr.company} (${tr.year})`).join(", ")}</dd>
          </div>
        )}
        {tests.length > 0 && (
          <div>
            <dt className="font-semibold">{t("candidate.tests")}</dt>
            <dd>{tests.map((x) => (x.score !== undefined ? `${x.name} : ${x.score}` : x.name)).join(", ")}</dd>
          </div>
        )}
        {(card.languages?.length ?? 0) > 0 && (
          <div>
            <dt className="font-semibold">{t("candidate.languages")}</dt>
            <dd>{card.languages!.map((l) => t(`languages.${l}`)).join(", ")}</dd>
          </div>
        )}
        {(card.soft_skills?.length ?? 0) > 0 && (
          <div>
            <dt className="font-semibold">{t("candidate.softSkills")}</dt>
            <dd>{card.soft_skills!.map((s) => t(`softSkills.${s}`)).join(", ")}</dd>
          </div>
        )}
        {(card.has_moped_license || card.does_volunteering) && (
          <div>
            <dd>{[card.has_moped_license && t("candidate.moped"), card.does_volunteering && t("candidate.volunteering")].filter(Boolean).join(" · ")}</dd>
          </div>
        )}
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
      {match && <Gauge match={match} />}
    </article>
  );
}
