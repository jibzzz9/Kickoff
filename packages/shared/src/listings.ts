import { z } from "zod";

export const CRITERION_KEYS = [
  "trial_done",
  "min_average",
  "aptitude_test",
  "languages",
  "moped_license",
  "volunteering",
] as const;
export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const CRITERION_KINDS = ["required", "bonus"] as const;
export type CriterionKind = (typeof CRITERION_KINDS)[number];

/** « Ce qui compte le plus » : pondération de 1 (un peu) à 3 (beaucoup). */
export const WEIGHT_KEYS = ["motivation", "grades", "soft_skills", "practical_experience"] as const;
export type WeightKey = (typeof WEIGHT_KEYS)[number];
export const DEFAULT_WEIGHTS: Record<WeightKey, number> = {
  motivation: 2,
  grades: 2,
  soft_skills: 2,
  practical_experience: 2,
};

export const LANGUAGE_CODES = ["fr", "de", "it", "en", "es", "pt"] as const;
export const SOFT_SKILLS = [
  "punctual",
  "team_player",
  "curious",
  "careful",
  "friendly",
  "autonomous",
  "organized",
  "patient",
] as const;

export const LISTING_STATUSES = ["draft", "open", "filled", "closed"] as const;
export const APPLICATION_STATUSES = [
  "sent",
  "followed_up",
  "trial",
  "interview",
  "offer",
  "accepted",
  "declined",
  "not_this_time",
  "waitlist",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const kind = z.enum(CRITERION_KINDS);
const language = z.enum(LANGUAGE_CODES);

export const criterionSchema = z.discriminatedUnion("key", [
  z.object({ kind, key: z.literal("trial_done"), value: z.literal(true) }),
  z.object({ kind, key: z.literal("min_average"), value: z.number().min(1).max(6) }),
  z.object({ kind, key: z.literal("aptitude_test"), value: z.literal(true) }),
  z.object({ kind, key: z.literal("languages"), value: z.array(language).min(1) }),
  z.object({ kind, key: z.literal("moped_license"), value: z.literal(true) }),
  z.object({ kind, key: z.literal("volunteering"), value: z.literal(true) }),
]);
export type Criterion = z.infer<typeof criterionSchema>;

const weight = z.number().int().min(1).max(3);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listingInputSchema = z
  .object({
    companyId: z.string().uuid(),
    professionId: z.string().uuid(),
    communeId: z.string().uuid(),
    address: z.string().trim().max(200).optional(),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(20).max(4000),
    startDate: isoDate,
    placesCount: z.number().int().min(1).max(50),
    contactName: z.string().trim().min(1).max(100),
    contactEmail: z.string().email().optional(),
    trialDates: z.array(isoDate).max(20).default([]),
    criteria: z.array(criterionSchema).max(12).default([]),
    weights: z.object({
      motivation: weight,
      grades: weight,
      soft_skills: weight,
      practical_experience: weight,
    }),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<string>();
    for (const c of v.criteria) {
      const k = `${c.kind}:${c.key}`;
      if (seen.has(k)) ctx.addIssue({ code: "custom", path: ["criteria"], message: "duplicate_criterion" });
      seen.add(k);
    }
  });
export type ListingInput = z.infer<typeof listingInputSchema>;

/** Format attendu par la fonction SQL create_listing(p jsonb). */
export function toCreateListingPayload(v: ListingInput) {
  return {
    company_id: v.companyId,
    profession_id: v.professionId,
    commune_id: v.communeId,
    address: v.address ?? "",
    title: v.title,
    description: v.description,
    start_date: v.startDate,
    places_count: v.placesCount,
    contact_name: v.contactName,
    contact_email: v.contactEmail ?? "",
    trial_dates: v.trialDates,
    weights: v.weights,
    criteria: v.criteria,
  };
}

export const applicationInputSchema = z.object({
  listingId: z.string().uuid(),
  coverLetter: z.string().trim().max(5000).optional(),
  cvDocumentId: z.string().uuid().optional(),
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;
