// Edge Function `parent-consent` : email au parent d'un élève de moins de 16 ans, puis confirmation par le lien.
//  - send    : appelé par la base à l'inscription (clé serveur) ou par l'élève pour renvoyer l'email
//  - info    : prénom de l'élève pour la page de confirmation (jeton requis)
//  - confirm : le parent clique « Je donne mon accord » (jeton requis ; pas de validation automatique à l'ouverture du lien)
import { parentConsentEmail, type EmailLang } from "../../../packages/shared/src/emails.ts";
import { corsHeaders, json, sha256 } from "../_shared/http.ts";
import { emailProvider, randomToken, siteUrl } from "../_shared/email.ts";
import { callerUser, isServiceCall, serviceClient } from "../_shared/supabase.ts";

const EXPIRES_DAYS = 7;

async function send(studentId: string) {
  const db = serviceClient();
  const { data: s } = await db.from("students").select("first_name, parent_email, parental_consent, profiles(locale)").eq("profile_id", studentId).single();
  if (!s || s.parental_consent !== "pending" || !s.parent_email) return json({ sent: false });

  // Un seul lien actif à la fois.
  await db.from("parental_consents").delete().eq("student_id", studentId).is("confirmed_at", null);
  const token = randomToken();
  await db.from("parental_consents").insert({
    student_id: studentId, parent_email: s.parent_email, token_hash: await sha256(token),
    expires_at: new Date(Date.now() + EXPIRES_DAYS * 864e5).toISOString(),
  });
  const lang = ((s.profiles as unknown as { locale: string } | null)?.locale ?? "fr") as EmailLang;
  const email = parentConsentEmail(lang, { firstName: s.first_name, url: `${siteUrl()}/${lang}/consent/${token}`, expiresDays: EXPIRES_DAYS });
  await emailProvider().send({ to: s.parent_email, ...email });
  return json({ sent: true });
}

async function findConsent(token: string) {
  const { data } = await serviceClient()
    .from("parental_consents")
    .select("id, student_id, confirmed_at, expires_at, students(first_name)")
    .eq("token_hash", await sha256(token))
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "send") {
      if (isServiceCall(req) && typeof body.student_id === "string") return await send(body.student_id);
      const user = await callerUser(req);
      return user ? await send(user.id) : json({ error: "forbidden" }, 403);
    }
    if ((body.action === "info" || body.action === "confirm") && typeof body.token === "string") {
      const c = await findConsent(body.token);
      if (!c) return json({ error: "invalid_or_expired" }, 404);
      const firstName = (c.students as unknown as { first_name: string }).first_name;
      if (body.action === "info") return json({ firstName, confirmed: Boolean(c.confirmed_at) });
      const db = serviceClient();
      const now = new Date().toISOString();
      await db.from("parental_consents").update({ confirmed_at: now }).eq("id", c.id);
      await db.from("students").update({ parental_consent: "granted", parental_consent_at: now }).eq("profile_id", c.student_id);
      return json({ firstName, confirmed: true });
    }
    return json({ error: "bad_request" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "internal_error" }, 500);
  }
});
