/**
 * Moteur de score Kickoff — partie déterministe.
 *
 * - Aucune dépendance et aucun import : ce fichier est aussi importé tel quel par les Edge Functions (Deno).
 * - Même calcul pour l'élève (anneau %) et l'entreprise (jauge 5 segments), présenté différemment.
 * - Ne lit que les champs listés dans ScoringProfile : jamais de nom, âge, genre, nationalité, origine,
 *   religion, adresse, photo ou santé.
 * - Le résultat éclaire une décision humaine : il ne rejette jamais personne.
 *
 * Toute modification du calcul doit changer ALGO_VERSION (journalisée avec chaque score).
 */

export const ALGO_VERSION = "1.0.0";

export type ScoringKind = "required" | "bonus";
export type ScoringCriterion = { kind: ScoringKind; key: string; value: unknown };
export type Dimension = "motivation" | "grades" | "soft_skills" | "practical_experience";
export type Weights = Record<Dimension, number>;

/** Les seules données d'un dossier utilisées par le calcul. */
export type ScoringProfile = {
  average: number | null;
  aptitudeTests: { name: string; score?: number }[];
  trialInternships: { professionCode: string }[];
  languages: string[];
  softSkills: string[];
  hasMopedLicense: boolean;
  doesVolunteering: boolean;
  coverLetterLength: number;
  hasCv: boolean;
};

export type ScoringListing = { professionCode: string; criteria: ScoringCriterion[]; weights: Weights };

export type CriterionStatus = "met" | "not_met" | "unknown";
export type Badge = "very_interesting" | "interesting" | "to_discover" | "incomplete";
export type MissingInfo = "grades" | "languages" | "soft_skills" | "cv";

/** Atouts : toujours formulés positivement (clés traduites par les apps). */
export type StrengthKey =
  | "trials_in_profession"
  | "trials_other"
  | "good_average"
  | "test_result"
  | "test_done"
  | "motivated_letter"
  | "volunteering"
  | "languages_match"
  | "moped_license"
  | "soft_skills";
export type Strength = { key: StrengthKey; params?: Record<string, string | number> };

/** Actions concrètes proposées à l'élève, avec le score projeté si l'action est réalisée. */
export type ActionKey =
  | "do_trial"
  | "add_average"
  | "improve_average"
  | "take_aptitude_test"
  | "add_languages"
  | "learn_language"
  | "get_moped_license"
  | "try_volunteering"
  | "write_letter"
  | "add_soft_skills"
  | "add_cv";
export type Improvement = { action: ActionKey; params?: Record<string, string | number>; projectedScore: number | null };

export type MatchResult = {
  algoVersion: string;
  score: number;
  segments: 0 | 1 | 2 | 3 | 4 | 5;
  badge: Badge;
  complete: boolean;
  missingInfo: MissingInfo[];
  criteria: { kind: ScoringKind; key: string; status: CriterionStatus }[];
  strengths: Strength[];
  improvements: Improvement[];
};

const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asNumber = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Construit le profil de scoring à partir d'une ligne `students` ou `candidate_cards`.
 * Liste blanche stricte : tout autre champ (prénom, âge, commune…) est ignoré.
 */
export function toScoringProfile(row: Record<string, unknown>, extra: { hasCv?: boolean; coverLetter?: string | null } = {}): ScoringProfile {
  const grades = (row.grades ?? {}) as { average?: unknown };
  const letter = extra.coverLetter !== undefined ? extra.coverLetter : row.cover_letter;
  return {
    average: asNumber(grades.average),
    aptitudeTests: asArray<{ name?: unknown; score?: unknown }>(row.aptitude_tests)
      .filter((t) => typeof t?.name === "string")
      .map((t) => ({ name: String(t.name), ...(asNumber(t.score) !== null ? { score: asNumber(t.score)! } : {}) })),
    trialInternships: asArray<{ professionCode?: unknown }>(row.trial_internships)
      .filter((t) => typeof t?.professionCode === "string")
      .map((t) => ({ professionCode: String(t.professionCode) })),
    languages: asArray<unknown>(row.languages).map(String),
    softSkills: asArray<unknown>(row.soft_skills).map(String),
    hasMopedLicense: row.has_moped_license === true,
    doesVolunteering: row.does_volunteering === true,
    coverLetterLength: typeof letter === "string" ? letter.trim().length : 0,
    hasCv: extra.hasCv ?? Boolean(row.cv_path),
  };
}

export function evaluateCriterion(c: ScoringCriterion, p: ScoringProfile, professionCode: string): CriterionStatus {
  switch (c.key) {
    case "trial_done":
      return p.trialInternships.some((t) => t.professionCode === professionCode) ? "met" : "not_met";
    case "min_average": {
      const min = asNumber(c.value);
      if (p.average === null || min === null) return "unknown";
      return p.average >= min ? "met" : "not_met";
    }
    case "aptitude_test":
      return p.aptitudeTests.length > 0 ? "met" : "not_met";
    case "languages": {
      if (p.languages.length === 0) return "unknown";
      return asArray<string>(c.value).every((l) => p.languages.includes(l)) ? "met" : "not_met";
    }
    case "moped_license":
      return p.hasMopedLicense ? "met" : "not_met";
    case "volunteering":
      return p.doesVolunteering ? "met" : "not_met";
    default:
      return "unknown";
  }
}

/** Valeur 0-1 de chaque dimension, ou null si l'information manque. */
export function dimensionScores(p: ScoringProfile, professionCode: string): Record<Dimension, number | null> {
  const testScores = p.aptitudeTests.map((t) => t.score).filter((s): s is number => s !== undefined);
  const fromAverage = p.average !== null ? clamp((p.average - 3) / 3) : null;
  const fromTests = testScores.length ? clamp(testScores.reduce((a, b) => a + b, 0) / testScores.length / 100) : null;
  const grades =
    fromAverage !== null && fromTests !== null ? 0.7 * fromAverage + 0.3 * fromTests : (fromAverage ?? fromTests);

  const sameTrials = p.trialInternships.filter((t) => t.professionCode === professionCode).length;
  const otherTrials = p.trialInternships.length - sameTrials;
  const practical = Math.max(sameTrials >= 2 ? 1 : sameTrials === 1 ? 0.8 : 0, Math.min(0.3 * otherTrials, 0.5));

  const softSkills = p.softSkills.length ? clamp(p.softSkills.length / 3) : null;

  const letter = p.coverLetterLength >= 400 ? 0.6 : p.coverLetterLength >= 150 ? 0.45 : p.coverLetterLength > 0 ? 0.25 : 0;
  const motivation = clamp(letter + (p.doesVolunteering ? 0.2 : 0) + (sameTrials > 0 ? 0.2 : 0));

  return { grades, practical_experience: practical, soft_skills: softSkills, motivation };
}

const statusValue = (s: CriterionStatus) => (s === "met" ? 1 : s === "unknown" ? 0.5 : 0);

function rawScore(p: ScoringProfile, listing: ScoringListing) {
  const dims = dimensionScores(p, listing.professionCode);
  const keys = Object.keys(listing.weights) as Dimension[];
  const totalWeight = keys.reduce((a, k) => a + listing.weights[k], 0) || 1;
  // Une dimension inconnue compte pour 0,5 (neutre) et rend le profil incomplet.
  const base = keys.reduce((a, k) => a + listing.weights[k] * (dims[k] ?? 0.5), 0) / totalWeight;

  const criteria = listing.criteria.map((c) => ({ kind: c.kind, key: c.key, status: evaluateCriterion(c, p, listing.professionCode) }));
  const ratio = (kind: ScoringKind) => {
    const xs = criteria.filter((c) => c.kind === kind);
    return xs.length ? xs.reduce((a, c) => a + statusValue(c.status), 0) / xs.length : null;
  };
  const req = ratio("required");
  const bonus = ratio("bonus");

  let x: number;
  if (req !== null && bonus !== null) x = 0.5 * base + 0.35 * req + 0.15 * bonus;
  else if (req !== null) x = 0.6 * base + 0.4 * req;
  else if (bonus !== null) x = 0.8 * base + 0.2 * bonus;
  else x = base;

  return { score: Math.round(100 * clamp(x)), criteria, dims };
}

export function segmentsFor(score: number, requiredNotMet: boolean): 1 | 2 | 3 | 4 | 5 {
  const s = score >= 85 ? 5 : score >= 70 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;
  // « Très intéressant » suppose que tous les critères indispensables sont remplis.
  return (requiredNotMet ? Math.min(s, 3) : s) as 1 | 2 | 3 | 4 | 5;
}

export function badgeFor(segments: number, complete: boolean): Badge {
  if (!complete) return "incomplete";
  return segments >= 4 ? "very_interesting" : segments === 3 ? "interesting" : "to_discover";
}

export function computeMatch(p: ScoringProfile, listing: ScoringListing): MatchResult {
  const { score, criteria, dims } = rawScore(p, listing);
  const w = listing.weights;

  const missingInfo: MissingInfo[] = [];
  if (dims.grades === null) missingInfo.push("grades");
  if (p.languages.length === 0) missingInfo.push("languages");
  if (dims.soft_skills === null) missingInfo.push("soft_skills");
  if (!p.hasCv) missingInfo.push("cv");
  const requiredUnknown = criteria.some((c) => c.kind === "required" && c.status === "unknown");
  const complete = !requiredUnknown && missingInfo.length < 2;

  const requiredNotMet = criteria.some((c) => c.kind === "required" && c.status !== "met");
  const segments = segmentsFor(score, requiredNotMet);

  return {
    algoVersion: ALGO_VERSION,
    score,
    segments,
    badge: badgeFor(segments, complete),
    complete,
    missingInfo,
    criteria,
    strengths: strengthsFor(p, listing, criteria, w),
    improvements: improvementsFor(p, listing, criteria, score, missingInfo),
  };
}

function strengthsFor(p: ScoringProfile, listing: ScoringListing, criteria: MatchResult["criteria"], w: Weights): Strength[] {
  const out: { s: Strength; weight: number }[] = [];
  // Un atout qui remplit un critère de l'annonce passe devant (indispensable avant « un plus »).
  const boost = (key: string) => {
    const met = criteria.filter((c) => c.key === key && c.status === "met");
    return met.some((c) => c.kind === "required") ? 3 : met.length ? 1.5 : 0;
  };

  const same = p.trialInternships.filter((t) => t.professionCode === listing.professionCode).length;
  const other = p.trialInternships.length - same;
  if (same) out.push({ s: { key: "trials_in_profession", params: { count: same } }, weight: w.practical_experience + 0.5 + boost("trial_done") });
  else if (other) out.push({ s: { key: "trials_other", params: { count: other } }, weight: w.practical_experience });

  if (p.average !== null && p.average >= 4.5)
    out.push({ s: { key: "good_average", params: { value: p.average } }, weight: w.grades + boost("min_average") });
  const best = p.aptitudeTests.filter((t) => t.score !== undefined).sort((a, b) => b.score! - a.score!)[0];
  if (best && best.score! >= 60)
    out.push({ s: { key: "test_result", params: { name: best.name, score: best.score! } }, weight: w.grades - 0.1 + boost("aptitude_test") });
  else if (p.aptitudeTests.length) out.push({ s: { key: "test_done" }, weight: w.grades - 0.5 + boost("aptitude_test") });

  if (p.coverLetterLength >= 150) out.push({ s: { key: "motivated_letter" }, weight: w.motivation });
  if (p.doesVolunteering) out.push({ s: { key: "volunteering" }, weight: w.motivation - 0.2 + boost("volunteering") });
  if (boost("languages")) out.push({ s: { key: "languages_match", params: { languages: p.languages.join(",") } }, weight: 1.5 + boost("languages") });
  if (p.hasMopedLicense && boost("moped_license")) out.push({ s: { key: "moped_license" }, weight: 1.2 + boost("moped_license") });
  if (p.softSkills.length >= 3) out.push({ s: { key: "soft_skills", params: { count: p.softSkills.length } }, weight: w.soft_skills });

  return out.sort((a, b) => b.weight - a.weight).slice(0, 3).map((x) => x.s);
}

function improvementsFor(
  p: ScoringProfile,
  listing: ScoringListing,
  criteria: MatchResult["criteria"],
  score: number,
  missingInfo: MissingInfo[],
): Improvement[] {
  const project = (q: Partial<ScoringProfile>) => rawScore({ ...p, ...q }, listing).score;
  const out: Improvement[] = [];

  for (const c of criteria) {
    if (c.status === "met") continue;
    const crit = listing.criteria.find((x) => x.key === c.key && x.kind === c.kind)!;
    switch (c.key) {
      case "trial_done":
        out.push({ action: "do_trial", projectedScore: project({ trialInternships: [...p.trialInternships, { professionCode: listing.professionCode }] }) });
        break;
      case "min_average":
        out.push(
          p.average === null
            ? { action: "add_average", projectedScore: null }
            : { action: "improve_average", params: { value: Number(crit.value) }, projectedScore: project({ average: Number(crit.value) }) },
        );
        break;
      case "aptitude_test":
        out.push({ action: "take_aptitude_test", projectedScore: project({ aptitudeTests: [...p.aptitudeTests, { name: "test" }] }) });
        break;
      case "languages": {
        if (c.status === "unknown") out.push({ action: "add_languages", projectedScore: null });
        else {
          const missing = asArray<string>(crit.value).filter((l) => !p.languages.includes(l));
          out.push({ action: "learn_language", params: { languages: missing.join(",") }, projectedScore: project({ languages: [...p.languages, ...missing] }) });
        }
        break;
      }
      case "moped_license":
        out.push({ action: "get_moped_license", projectedScore: project({ hasMopedLicense: true }) });
        break;
      case "volunteering":
        out.push({ action: "try_volunteering", projectedScore: project({ doesVolunteering: true }) });
        break;
    }
  }
  // Un stage d'essai dans le métier compte toujours (expérience pratique + motivation), même sans critère explicite.
  if (!out.some((i) => i.action === "do_trial") && !p.trialInternships.some((t) => t.professionCode === listing.professionCode)) {
    out.push({ action: "do_trial", projectedScore: project({ trialInternships: [...p.trialInternships, { professionCode: listing.professionCode }] }) });
  }
  if (p.coverLetterLength < 150) out.push({ action: "write_letter", projectedScore: project({ coverLetterLength: 400 }) });
  if (missingInfo.includes("grades") && !out.some((i) => i.action === "add_average")) out.push({ action: "add_average", projectedScore: null });
  if (missingInfo.includes("soft_skills")) out.push({ action: "add_soft_skills", projectedScore: project({ softSkills: ["a", "b", "c"] }) });
  if (missingInfo.includes("cv")) out.push({ action: "add_cv", projectedScore: null });

  // Les actions qui font le plus progresser d'abord ; on n'affiche que celles qui apportent quelque chose.
  const gain = (i: Improvement) => (i.projectedScore === null ? 0.5 : i.projectedScore - score);
  return out.filter((i) => i.projectedScore === null || i.projectedScore > score).sort((a, b) => gain(b) - gain(a)).slice(0, 3);
}
