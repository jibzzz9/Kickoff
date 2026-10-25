import { describe, expect, it } from "vitest";
import { guardianInviteEmail, parentConsentEmail } from "./emails";

describe("emails", () => {
  it("email de consentement : prénom, lien, explication IA et humain, FR et DE", () => {
    for (const lang of ["fr", "de"] as const) {
      const e = parentConsentEmail(lang, { firstName: "Mia", url: "https://kickoff.ch/c/abc", expiresDays: 7 });
      expect(e.subject).toContain("Mia");
      expect(e.text).toContain("https://kickoff.ch/c/abc");
      expect(e.html).toContain('href="https://kickoff.ch/c/abc"');
      expect(e.text).toMatch(lang === "fr" ? /une personne qui décide/ : /ein Mensch/);
    }
  });
  it("échappe le HTML du prénom", () => {
    const e = guardianInviteEmail("fr", { firstName: "<b>X</b>", relation: "teacher", url: "https://x", expiresDays: 14 });
    expect(e.html).not.toContain("<b>X</b>");
    expect(e.html).toContain("&lt;b&gt;X&lt;/b&gt;");
    expect(e.text).toContain("enseignant");
  });
});
