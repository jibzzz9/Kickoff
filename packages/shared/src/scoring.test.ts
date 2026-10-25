import { describe, expect, it } from "vitest";
import {
  ALGO_VERSION,
  computeMatch,
  segmentsFor,
  toScoringProfile,
  type ScoringListing,
  type ScoringProfile,
} from "./scoring";

const W = { motivation: 2, grades: 2, soft_skills: 2, practical_experience: 2 };

const strong: ScoringProfile = {
  average: 5.2,
  aptitudeTests: [{ name: "Multicheck", score: 82 }],
  trialInternships: [{ professionCode: "assc" }, { professionCode: "assc" }],
  languages: ["fr", "de"],
  softSkills: ["punctual", "friendly", "team_player"],
  hasMopedLicense: false,
  doesVolunteering: true,
  coverLetterLength: 600,
  hasCv: true,
};

const assc: ScoringListing = {
  professionCode: "assc",
  weights: { ...W, motivation: 3, soft_skills: 3 },
  criteria: [
    { kind: "required", key: "trial_done", value: true },
    { kind: "bonus", key: "languages", value: ["de"] },
  ],
};

describe("computeMatch", () => {
  it("profil qui coche tout : très intéressant, 5 segments", () => {
    const r = computeMatch(strong, assc);
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.segments).toBe(5);
    expect(r.badge).toBe("very_interesting");
    expect(r.algoVersion).toBe(ALGO_VERSION);
  });

  it("est déterministe (même dossier, même résultat)", () => {
    expect(computeMatch(strong, assc)).toEqual(computeMatch(structuredClone(strong), structuredClone(assc)));
  });

  it("critère indispensable non rempli : jamais plus de 3 segments, mais jamais de libellé négatif", () => {
    const noTrial = { ...strong, trialInternships: [] };
    const r = computeMatch(noTrial, assc);
    expect(r.segments).toBeLessThanOrEqual(3);
    expect(["very_interesting", "interesting", "to_discover", "incomplete"]).toContain(r.badge);
    expect(r.criteria.find((c) => c.key === "trial_done")?.status).toBe("not_met");
  });

  it("propose une action concrète avec le score projeté (« fais un stage d'essai pour passer à X % »)", () => {
    const noTrial = { ...strong, trialInternships: [] };
    const r = computeMatch(noTrial, assc);
    const trial = r.improvements.find((i) => i.action === "do_trial");
    expect(trial).toBeDefined();
    expect(trial!.projectedScore!).toBeGreaterThan(r.score);
    expect(trial!.projectedScore!).toBe(computeMatch({ ...noTrial, trialInternships: [{ professionCode: "assc" }] }, assc).score);
  });

  it("suggère un stage d'essai dans le métier même sans critère explicite", () => {
    const listing: ScoringListing = { professionCode: "logisticien", criteria: [], weights: { ...W, practical_experience: 3 } };
    const r = computeMatch(strong, listing);
    const trial = r.improvements.find((i) => i.action === "do_trial");
    expect(trial?.projectedScore).toBeGreaterThan(r.score);
  });

  it("informations manquantes : badge « profil incomplet »", () => {
    const empty: ScoringProfile = { ...strong, average: null, aptitudeTests: [], languages: [], softSkills: [], hasCv: false };
    const r = computeMatch(empty, assc);
    expect(r.complete).toBe(false);
    expect(r.badge).toBe("incomplete");
    expect(r.missingInfo).toEqual(expect.arrayContaining(["grades", "languages", "soft_skills", "cv"]));
  });

  it("critère indispensable impossible à vérifier : profil incomplet", () => {
    const listing: ScoringListing = { ...assc, criteria: [{ kind: "required", key: "min_average", value: 4.5 }] };
    const r = computeMatch({ ...strong, average: null, aptitudeTests: [] }, listing);
    expect(r.criteria[0]!.status).toBe("unknown");
    expect(r.badge).toBe("incomplete");
  });

  it("les pondérations de l'entreprise changent l'ordre des profils", () => {
    // Deux profils identiques, sauf : très bonnes notes sans stage / notes moyennes avec deux stages.
    const grades: ScoringProfile = { ...strong, average: 5.8, trialInternships: [] };
    const practice: ScoringProfile = { ...strong, average: 4.0, aptitudeTests: [], trialInternships: [{ professionCode: "logisticien" }, { professionCode: "logisticien" }] };
    const base: ScoringListing = { professionCode: "logisticien", criteria: [], weights: W };
    const gradesFirst = { ...base, weights: { motivation: 1, grades: 3, soft_skills: 1, practical_experience: 1 } };
    const practiceFirst = { ...base, weights: { motivation: 1, grades: 1, soft_skills: 1, practical_experience: 3 } };
    expect(computeMatch(grades, gradesFirst).score).toBeGreaterThan(computeMatch(practice, gradesFirst).score);
    expect(computeMatch(practice, practiceFirst).score).toBeGreaterThan(computeMatch(grades, practiceFirst).score);
  });

  it("l'explication met d'abord en avant ce qui remplit un critère indispensable", () => {
    const r = computeMatch(strong, assc);
    expect(r.strengths[0]).toEqual({ key: "trials_in_profession", params: { count: 2 } });
  });

  it("score toujours entre 0 et 100, au plus 3 atouts et 3 actions", () => {
    const profiles: ScoringProfile[] = [strong, { ...strong, average: 1, aptitudeTests: [{ name: "x", score: 0 }], trialInternships: [], softSkills: [], coverLetterLength: 0, doesVolunteering: false }];
    for (const p of profiles) {
      const r = computeMatch(p, assc);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.strengths.length).toBeLessThanOrEqual(3);
      expect(r.improvements.length).toBeLessThanOrEqual(3);
    }
  });

  it("« à découvrir » : met en avant d'autres atouts même sans les critères", () => {
    const p: ScoringProfile = { ...strong, trialInternships: [{ professionCode: "logisticien" }], languages: ["fr"] };
    const r = computeMatch(p, assc);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.strengths.map((s) => s.key)).not.toContain("trials_in_profession");
  });
});

describe("segmentsFor", () => {
  it("respecte les seuils", () => {
    expect([90, 75, 60, 40, 10].map((s) => segmentsFor(s, false))).toEqual([5, 4, 3, 2, 1]);
    expect(segmentsFor(95, true)).toBe(3);
  });
});

describe("toScoringProfile (garde-fou anti-discrimination)", () => {
  const row = {
    grades: { average: 5 },
    aptitude_tests: [{ name: "Basic-check", score: 70 }],
    trial_internships: [{ professionCode: "assc", company: "EMS", year: 2026 }],
    languages: ["fr"],
    soft_skills: ["punctual"],
    has_moped_license: false,
    does_volunteering: false,
    cover_letter: "Bonjour",
    cv_path: "x/cv.pdf",
  };
  it("ignore prénom, âge, commune, genre, nationalité… : le score est identique", () => {
    const withPersonal = { ...row, first_name: "Aïcha", age: 15, commune: "Sion", gender: "f", nationality: "XX", religion: "y", photo_url: "p" };
    expect(computeMatch(toScoringProfile(withPersonal), assc)).toEqual(computeMatch(toScoringProfile(row), assc));
  });
  it("ne garde que les champs de la liste blanche", () => {
    expect(Object.keys(toScoringProfile({ ...row, first_name: "x" })).sort()).toEqual(
      ["aptitudeTests", "average", "coverLetterLength", "doesVolunteering", "hasCv", "hasMopedLicense", "languages", "softSkills", "trialInternships"],
    );
  });
});
