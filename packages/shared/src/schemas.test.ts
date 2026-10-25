import { describe, expect, it } from "vitest";
import { ageOn, signupCompanySchema, signupStudentSchema } from "./schemas";

const today = new Date("2026-10-24");

describe("age", () => {
  it("calcule l'âge en années pleines", () => {
    expect(ageOn(new Date("2010-10-25"), today)).toBe(15);
    expect(ageOn(new Date("2010-10-24"), today)).toBe(16);
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
  it("accepte un élève de 14 ans sans aucune information sur ses parents", () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - 14);
    expect(signupStudentSchema.safeParse({ ...base, birthDate: young }).success).toBe(true);
  });
  it("refuse une date de naissance invraisemblable", () => {
    expect(signupStudentSchema.safeParse({ ...base, birthDate: "2024-01-01" }).success).toBe(false);
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
