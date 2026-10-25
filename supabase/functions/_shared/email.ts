// Envoi d'emails derrière une interface : Mailpit en local (gratuit), fournisseur payant branché en fin de projet.
export type OutgoingEmail = { to: string; subject: string; text: string; html: string };

export interface EmailProvider {
  send(email: OutgoingEmail): Promise<void>;
}

const FROM = { Email: Deno.env.get("EMAIL_FROM") ?? "noreply@kickoff.ch", Name: "Kickoff" };

/** Mailpit (boîte de réception de développement de Supabase) : http://127.0.0.1:54324 */
class MailpitProvider implements EmailProvider {
  constructor(private url: string) {}
  async send(e: OutgoingEmail) {
    const res = await fetch(`${this.url}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ From: FROM, To: [{ Email: e.to }], Subject: e.subject, Text: e.text, HTML: e.html }),
    });
    if (!res.ok) throw new Error(`mailpit_${res.status}`);
  }
}

/** Sans fournisseur configuré : rien n'est envoyé (journal sans contenu personnel). */
class NoopProvider implements EmailProvider {
  async send(e: OutgoingEmail) {
    console.warn(`email non envoyé (aucun fournisseur configuré) : ${e.subject.length} caractères`);
  }
}

export function emailProvider(): EmailProvider {
  const mailpit = Deno.env.get("MAILPIT_URL");
  if (mailpit) return new MailpitProvider(mailpit);
  return new NoopProvider();
}

export const siteUrl = () => (Deno.env.get("SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

/** Jeton aléatoire (lien envoyé par email) ; seule son empreinte SHA-256 est stockée. */
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
