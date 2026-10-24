import { describe, expect, it } from "vitest";
import { ageOn, needsParentConsent, signupCompanySchema, signupStudentSchema } from "./schemas";

const today = new Date("2026-10-24");

describe("age", () => {
  it("calcule l'âge en années pleines", () => {
    expect(ageOn(new Date("2010-10-25"), today)).toBe(15);
    expect(ageOn(new Date("2010-10-24"), today)).toBe(16);
  });
  it("exige le consentement parental sous le seuil configurable", () => {
    expect(needsParentConsent(new Date("2011-01-01"), 16, today)).toBe(true);
    expect(needsParentConsent(new Date("2011-01-01"), 15, today)).toBe(false);
  });
});

describe("signupStudentSchema", () => {
  const base = {
    email: "lea@example.ch",
    password: "motdepasse1",
    firstName: "Léa",
    commune: "Sion",
    acceptTerms: true,
    acceptAiNotice: true,
  };
  it("refuse un mineur sans email parent", () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - 14);
    const r = signupStudentSchema.safeParse({ ...base, birthDate: young });
    expect(r.success).toBe(false);
  });
  it("accepte un mineur avec email parent", () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - 14);
    const r = signupStudentSchema.safeParse({ ...base, birthDate: young, parentEmail: "p@example.ch" });
    expect(r.success).toBe(true);
  });
  it("exige l'acceptation de la notice IA", () => {
    const r = signupStudentSchema.safeParse({ ...base, acceptAiNotice: false, birthDate: "2000-01-01" });
    expect(r.success).toBe(false);
  });
});

describe("signupCompanySchema", () => {
  it("valide un numéro IDE", () => {
    const base = {
      email: "a@b.ch", password: "motdepasse1", contactName: "Marc", companyName: "Garage Alpin",
      commune: "Brig", acceptTerms: true as const,
    };
    expect(signupCompanySchema.safeParse({ ...base, ideNumber: "CHE-123.456.789" }).success).toBe(true);
    expect(signupCompanySchema.safeParse({ ...base, ideNumber: "xx" }).success).toBe(false);
  });
});
