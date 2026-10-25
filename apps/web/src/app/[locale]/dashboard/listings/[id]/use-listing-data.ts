"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Database } from "@kickoff/shared";
import { createClient } from "@/lib/supabase/client";
import type { CompanyMatch } from "./gauge";

type Tables = Database["public"]["Tables"];
export type Card = Database["public"]["Views"]["candidate_cards"]["Row"];
export type Appointment = Tables["appointments"]["Row"] & { appointment_slots: Tables["appointment_slots"]["Row"][] };
export type Message = Tables["messages"]["Row"];
export type Note = Tables["recruiter_notes"]["Row"];
export type Evaluation = Tables["trial_evaluations"]["Row"];
export type ScoredMatch = CompanyMatch & { tip: string | null };

/** Toutes les données d'une annonce côté entreprise, tenues à jour en temps réel. */
export function useListingData(listingId: string, initial: Card[]) {
  const supabase = useMemo(() => createClient(), []);
  const [cards, setCards] = useState<Card[]>(initial);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, ScoredMatch>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Plusieurs événements temps réel peuvent arriver d'un coup : seule la réponse du dernier rafraîchissement est appliquée.
  const seq = useRef(0);
  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const { data: fresh } = await supabase.from("candidate_cards").select("*").eq("listing_id", listingId).order("created_at");
    const list = fresh ?? [];
    const ids = list.map((c) => c.application_id!);
    const [ap, msg, nt] = ids.length
      ? await Promise.all([
          supabase.from("appointments").select("*, appointment_slots!appointment_slots_appointment_id_fkey(*)").in("application_id", ids).order("created_at"),
          supabase.from("messages").select("*").in("application_id", ids).order("created_at"),
          supabase.from("recruiter_notes").select("*").in("application_id", ids).order("created_at"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];
    const trialIds = (ap.data ?? []).filter((a) => a.kind === "trial").map((a) => a.id);
    const ev = trialIds.length ? (await supabase.from("trial_evaluations").select("*").in("appointment_id", trialIds)).data : [];
    if (mine !== seq.current) return;
    setCards(list);
    setAppointments((ap.data ?? []) as Appointment[]);
    setMessages((msg.data ?? []) as Message[]);
    setNotes((nt.data ?? []) as Note[]);
    setEvaluations(ev ?? []);
  }, [listingId, supabase]);

  // Jauge : calculée côté serveur (Edge Function `match`), jamais dans le navigateur.
  const refreshScores = useCallback(async () => {
    const { data } = await supabase.functions.invoke<{ results: Record<string, ScoredMatch> }>("match", {
      body: { action: "score", listingId },
    });
    if (data?.results) setScores(data.results);
  }, [listingId, supabase]);

  useEffect(() => {
    void refresh();
    void refreshScores();
    const channel = supabase
      .channel(`listing-${listingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "applications", filter: `listing_id=eq.${listingId}` }, (payload) => {
        setNewIds((s) => new Set(s).add((payload.new as { id: string }).id));
        void refresh();
        void refreshScores();
      })
      // La RLS ne transmet que les rendez-vous et messages des candidatures de l'entreprise.
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refresh())
      // L'abonnement côté base peut prendre quelques secondes (ou se rétablir après une coupure) :
      // on rattrape alors les changements manqués entre-temps.
      .on("system", {}, (payload: { extension?: string; status?: string }) => {
        if (payload.extension === "postgres_changes" && payload.status === "ok") {
          void refresh();
          void refreshScores();
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, supabase, refresh, refreshScores]);

  return { supabase, cards, newIds, scores, appointments, messages, notes, evaluations, refresh };
}
