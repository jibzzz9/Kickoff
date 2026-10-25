/**
 * Emails transactionnels FR/DE (invitation parent/enseignant).
 * Sans dépendance : utilisé par les Edge Functions (Deno) et testé avec Vitest.
 */

export type EmailLang = "fr" | "de";
export type Email = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function render(subject: string, paragraphs: string[], cta: { label: string; url: string }, footer: string): Email {
  const text = [...paragraphs, `${cta.label} : ${cta.url}`, "", footer].join("\n\n");
  const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#F6F7FB;padding:24px;color:#0B0D1A">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px">
<p style="font-weight:800;font-size:20px;margin:0 0 16px">kickoff ↗</p>
${paragraphs.map((p) => `<p style="line-height:1.5">${esc(p)}</p>`).join("\n")}
<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:#C8F135;color:#0B0D1A;font-weight:800;padding:14px 22px;border-radius:12px;text-decoration:none">${esc(cta.label)}</a></p>
<p style="font-size:13px;color:#5B6075;line-height:1.5">${esc(footer)}</p>
</div></body></html>`;
  return { subject, text, html };
}


export function guardianInviteEmail(lang: EmailLang, p: { firstName: string; relation: "parent" | "teacher"; url: string; expiresDays: number }): Email {
  if (lang === "de") {
    const who = p.relation === "teacher" ? "als Lehrperson" : "als Elternteil";
    return render(
      `${p.firstName} lädt Sie zu Kickoff ein`,
      [
        "Guten Tag",
        `${p.firstName} lädt Sie ${who} ein, die Lehrstellensuche auf Kickoff mitzuverfolgen.`,
        `Sie sehen die Bewerbungen, die Termine und, falls ${p.firstName} es erlaubt, die Check-ups. Sie können nichts ändern und sehen die Nachrichten mit den Betrieben nicht. ${p.firstName} kann den Zugang jederzeit widerrufen.`,
        `Der Link ist ${p.expiresDays} Tage gültig.`,
      ],
      { label: "Einladung annehmen", url: p.url },
      "Sie kennen diese Person nicht? Ignorieren Sie diese E-Mail einfach.",
    );
  }
  const who = p.relation === "teacher" ? "en tant qu'enseignant·e" : "en tant que parent";
  return render(
    `${p.firstName} vous invite sur Kickoff`,
    [
      "Bonjour,",
      `${p.firstName} vous invite ${who} à suivre sa recherche de place d'apprentissage sur Kickoff.`,
      `Vous verrez ses candidatures, ses rendez-vous et, si ${p.firstName} l'accepte, ses check-ups. Vous ne pourrez rien modifier et ne verrez pas les messages échangés avec les entreprises. ${p.firstName} peut retirer cet accès à tout moment.`,
      `Le lien est valable ${p.expiresDays} jours.`,
    ],
    { label: "Accepter l'invitation", url: p.url },
    "Vous ne connaissez pas cette personne ? Ignorez simplement cet email.",
  );
}
