// Edge Function `match` : calcule les scores de compatibilité avec le moteur déterministe partagé.
//  - action "compat" (élève)    : score + ce qui correspond + ce qu'il manque. Jamais de badge ni de segments.
//  - action "score"  (entreprise) : badge + segments + atouts + détail des critères, enregistrés dans match_scores.
import { computeMatch, toScoringProfile, type ScoringCriterion, type ScoringListing, type Weights } from "../../../packages/shared/src/scoring.ts";
import { corsHeaders, json, sha256 } from "../_shared/http.ts";
import { serviceClient, userClient } from "../_shared/supabase.ts";

type Criterion = { listing_id: string; kind: "required" | "bonus"; key: string; value: unknown };

const groupCriteria = (rows: Criterion[]) => {
  const m = new Map<string, ScoringCriterion[]>();
  for (const r of rows) m.set(r.listing_id, [...(m.get(r.listing_id) ?? []), { kind: r.kind, key: r.key, value: r.value }]);
  return m;
};

async function compat(req: Request, listingIds: string[]) {
  const sb = userClient(req);
  const { data: student } = await sb.from("students").select("*").maybeSingle();
  if (!student) return json({ error: "not_a_student" }, 403);

  const ids = listingIds.slice(0, 100);
  const [{ data: listings }, { data: criteria }, { data: cv }, { data: apps }] = await Promise.all([
    sb.from("listing_cards").select("id, profession_code, weights").in("id", ids),
    sb.from("listing_criteria").select("listing_id, kind, key, value").in("listing_id", ids),
    sb.from("student_documents").select("id").eq("kind", "cv").limit(1),
    sb.from("applications").select("listing_id, cover_letter").in("listing_id", ids),
  ]);
  const byListing = groupCriteria((criteria ?? []) as Criterion[]);
  const letters = new Map((apps ?? []).map((a) => [a.listing_id, a.cover_letter as string | null]));

  const results: Record<string, unknown> = {};
  for (const l of listings ?? []) {
    const profile = toScoringProfile(student, { hasCv: (cv ?? []).length > 0, coverLetter: letters.get(l.id) ?? null });
    const r = computeMatch(profile, { professionCode: l.profession_code, weights: l.weights as Weights, criteria: byListing.get(l.id) ?? [] });
    // Vue élève : pas de badge, pas de segments (la jauge est réservée à l'entreprise).
    results[l.id] = {
      score: r.score,
      criteria: r.criteria,
      strengths: r.strengths,
      improvements: r.improvements,
      missingInfo: r.missingInfo,
      algoVersion: r.algoVersion,
    };
  }
  return json({ results });
}

async function score(req: Request, listingId: string) {
  const sb = userClient(req);
  // RLS : l'annonce n'est renvoyée que si l'appelant est membre de l'entreprise.
  const { data: listing } = await sb
    .from("listings")
    .select("id, company_id, weights, professions(code), listing_criteria(kind, key, value)")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return json({ error: "not_found" }, 404);

  const { data: allowed } = await sb.rpc("company_has_feature", { p_company: listing.company_id, p_feature: "ai_gauge" });
  if (!allowed) return json({ error: "plan_feature_disabled", feature: "ai_gauge" }, 402);

  const scoringListing: ScoringListing = {
    professionCode: (listing.professions as unknown as { code: string }).code,
    weights: listing.weights as Weights,
    criteria: listing.listing_criteria as ScoringCriterion[],
  };
  const { data: cards } = await sb.from("candidate_cards").select("*").eq("listing_id", listingId);

  const admin = serviceClient();
  const { data: existing } = await admin
    .from("match_scores")
    .select("application_id, inputs_hash, algo_version")
    .in("application_id", (cards ?? []).map((c) => c.application_id));
  const known = new Map((existing ?? []).map((e) => [e.application_id, `${e.algo_version}:${e.inputs_hash}`]));

  const results: Record<string, unknown> = {};
  for (const card of cards ?? []) {
    const profile = toScoringProfile(card);
    const r = computeMatch(profile, scoringListing);
    const details = { complete: r.complete, missingInfo: r.missingInfo, criteria: r.criteria, strengths: r.strengths };
    // tip : action la plus utile pour le jeune, proposée comme conseil dans le message « Pas cette fois ».
    results[card.application_id] = { score: r.score, segments: r.segments, badge: r.badge, ...details, tip: r.improvements[0]?.action ?? null };

    const hash = await sha256(JSON.stringify({ profile, listing: scoringListing }));
    if (known.get(card.application_id) === `${r.algoVersion}:${hash}`) continue; // déjà à jour
    const row = { application_id: card.application_id, score: r.score, segments: r.segments, badge: r.badge, algo_version: r.algoVersion, inputs_hash: hash };
    await admin.from("match_scores").upsert({ ...row, details, computed_at: new Date().toISOString() });
    await admin.from("score_audit_log").insert(row);
  }
  return json({ results });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await req.json();
    if (body.action === "compat" && Array.isArray(body.listingIds)) return await compat(req, body.listingIds.map(String));
    if (body.action === "score" && typeof body.listingId === "string") return await score(req, body.listingId);
    return json({ error: "bad_request" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "internal_error" }, 500);
  }
});
