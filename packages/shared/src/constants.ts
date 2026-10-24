export const LOCALES = ["fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const ROLES = ["student", "company_user", "parent", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const COMPANY_ROLES = ["admin", "trainer"] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export const SCHOOL_YEARS = ["10", "11"] as const;

/** Seuil par défaut ; la valeur réelle vit dans la table app_settings (configurable). */
export const DEFAULT_MIN_AGE_WITHOUT_PARENT_CONSENT = 16;

/** Jauge entreprise : 0-5 segments et badge associé. */
export type GaugeBadge = "very_interesting" | "interesting" | "to_discover" | "incomplete";

export const PILOT_PROFESSIONS = [
  { code: "assc", nameFr: "Assistant·e en soins et santé communautaire", nameDe: "Fachperson Gesundheit EFZ", type: "CFC" },
  { code: "employe-commerce", nameFr: "Employé·e de commerce", nameDe: "Kauffrau/Kaufmann EFZ", type: "CFC" },
  { code: "logisticien", nameFr: "Logisticien·ne", nameDe: "Logistiker/in EFZ", type: "CFC" },
] as const;
