import { describe, expect, it } from "vitest";
import { MESSAGE_TEMPLATES, NOTIFICATION_TEXTS, TIP_TEXTS, messageTemplate, notificationText } from "./texts";

const keys = (o: object) => Object.keys(o).sort();

describe("textes partagés", () => {
  it("FR et DE ont les mêmes clés", () => {
    expect(keys(NOTIFICATION_TEXTS.de)).toEqual(keys(NOTIFICATION_TEXTS.fr));
    expect(keys(MESSAGE_TEMPLATES.de)).toEqual(keys(MESSAGE_TEMPLATES.fr));
    expect(keys(TIP_TEXTS.de)).toEqual(keys(TIP_TEXTS.fr));
  });

  it("remplit les variables d'une notification", () => {
    const n = notificationText("fr", "invitation", { company: "Garage Alpin", appointment_kind: "trial" });
    expect(n.title).toBe("Garage Alpin t'invite 🎉");
    expect(n.body).toContain("stage d'essai");
  });

  it("rappel de rendez-vous : veille ou jour même, avec l'heure suisse", () => {
    const n = notificationText("de", "appointment_reminder", {
      when: "today", appointment_kind: "interview", company: "EMS", starts_at: "2027-01-12T08:30:00Z",
    });
    expect(n.title).toBe("Heute ist es so weit!");
    expect(n.body).toContain("09:30");
  });

  it("le message « pas cette fois » est respectueux et contient un conseil concret", () => {
    const m = messageTemplate("fr", "not_this_time", { firstName: "Léa", company: "EMS", sender: "Claire", tipAction: "do_trial" });
    expect(m).toContain("Bonjour Léa");
    expect(m).toContain("stage d'essai");
    expect(m).not.toMatch(/rejet|refus|mauvais|inadapt/i);
  });

  it("sans conseil spécifique, un encouragement général", () => {
    expect(messageTemplate("de", "not_this_time", { firstName: "Mia" })).toContain(TIP_TEXTS.de.default);
  });

  it("invitation groupée sans prénom : salutation neutre et propre", () => {
    expect(messageTemplate("fr", "invitation_interview", { company: "EMS" }).split("\n")[0]).toBe("Bonjour,");
    expect(messageTemplate("de", "invitation_trial", { company: "EMS" }).split("\n")[0]).toBe("Hallo");
    expect(messageTemplate("fr", "invitation_interview", { firstName: "Léa" }).split("\n")[0]).toBe("Bonjour Léa,");
  });

  it("aucune variable non remplie ne reste dans les textes", () => {
    for (const lang of ["fr", "de"] as const) {
      for (const kind of Object.keys(MESSAGE_TEMPLATES[lang]) as (keyof typeof MESSAGE_TEMPLATES.fr)[]) {
        expect(messageTemplate(lang, kind, { firstName: "A", company: "B", listing: "C", sender: "D" })).not.toMatch(/\{\w+\}/);
      }
    }
  });
});
