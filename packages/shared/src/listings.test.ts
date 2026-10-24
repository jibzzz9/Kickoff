import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, listingInputSchema, toCreateListingPayload } from "./listings";
import { studentProfileSchema, toStudentRow } from "./profile";

const id = "6f1c2c1e-6a0e-4b8e-9f43-3c1b1f1d2a10";
const base = {
  companyId: id,
  professionId: id,
  communeId: id,
  title: "Apprentissage ASSC",
  description: "Une super équipe t'attend pour 3 ans de formation.",
  startDate: "2027-08-16",
  placesCount: 2,
  contactName: "Claire",
  weights: DEFAULT_WEIGHTS,
};

describe("listingInputSchema", () => {
  it("accepte une annonce valide avec critères", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      criteria: [
        { kind: "required", key: "trial_done", value: true },
        { kind: "required", key: "languages", value: ["de"] },
        { kind: "bonus", key: "languages", value: ["fr"] },
      ],
    });
    expect(r.success).toBe(true);
  });
  it("refuse un critère en double", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      criteria: [
        { kind: "bonus", key: "moped_license", value: true },
        { kind: "bonus", key: "moped_license", value: true },
      ],
    });
    expect(r.success).toBe(false);
  });
  it("refuse une moyenne hors échelle suisse", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      criteria: [{ kind: "required", key: "min_average", value: 7 }],
    });
    expect(r.success).toBe(false);
  });
  it("refuse une pondération hors 1-3", () => {
    const r = listingInputSchema.safeParse({ ...base, weights: { ...DEFAULT_WEIGHTS, grades: 5 } });
    expect(r.success).toBe(false);
  });
  it("produit le payload attendu par create_listing", () => {
    const v = listingInputSchema.parse(base);
    const p = toCreateListingPayload(v);
    expect(p).toMatchObject({ company_id: id, start_date: "2027-08-16", criteria: [], trial_dates: [] });
  });
});

describe("studentProfileSchema", () => {
  it("convertit le profil en colonnes de la table students", () => {
    const p = studentProfileSchema.parse({ average: 5.1, languages: ["fr", "de"], softSkills: ["punctual"] });
    expect(toStudentRow(p)).toMatchObject({ grades: { average: 5.1 }, languages: ["fr", "de"], has_moped_license: false });
  });
  it("refuse une compétence inconnue", () => {
    expect(studentProfileSchema.safeParse({ softSkills: ["ninja"] }).success).toBe(false);
  });
});
