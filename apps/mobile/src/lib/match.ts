import type { Improvement, ScoringKind, CriterionStatus, Strength, MissingInfo } from "@kickoff/shared";
import { supabase } from "./supabase";

/** Vue élève du score : pas de badge ni de segments (réservés à l'entreprise). */
export type StudentMatch = {
  score: number;
  criteria: { kind: ScoringKind; key: string; status: CriterionStatus }[];
  strengths: Strength[];
  improvements: Improvement[];
  missingInfo: MissingInfo[];
};

/** Calcul côté serveur (Edge Function `match`). Renvoie {} en cas d'échec : l'app reste utilisable sans score. */
export async function fetchCompat(listingIds: string[]): Promise<Record<string, StudentMatch>> {
  if (!listingIds.length) return {};
  const { data, error } = await supabase.functions.invoke<{ results: Record<string, StudentMatch> }>("match", {
    body: { action: "compat", listingIds },
  });
  return error || !data ? {} : data.results;
}
