import { describe, expect, it } from "vitest";
import { guardianInviteEmail } from "./emails";

describe("emails", () => {
  it("email d'invitation : prénom, lien et lecture seule, FR et DE", () => {
    for (const lang of ["fr", "de"] as const) {
      const e = guardianInviteEmail(lang, { firstName: "Mia", relation: "parent", url: "https://kickoff.ch/i/abc", expiresDays: 14 });
      expect(e.subject).toContain("Mia");
      expect(e.text).toContain("https://kickoff.ch/i/abc");
      expect(e.html).toContain('href="https://kickoff.ch/i/abc"');
    }
  });
  it("échappe le HTML du prénom", () => {
    const e = guardianInviteEmail("fr", { firstName: "<b>X</b>", relation: "teacher", url: "https://x", expiresDays: 14 });
    expect(e.html).not.toContain("<b>X</b>");
    expect(e.html).toContain("&lt;b&gt;X&lt;/b&gt;");
    expect(e.text).toContain("enseignant");
  });
});
