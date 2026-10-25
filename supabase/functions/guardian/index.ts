// Edge Function `guardian` : accès en lecture seule d'un parent ou d'un enseignant, à l'initiative de l'élève.
//  - invite : l'élève invite une adresse email (parent ou enseignant)
//  - info   : prénom de l'élève pour la page d'invitation (jeton requis)
//  - accept : la personne invitée, connectée avec un compte parent/enseignant, accepte (jeton requis)
import { guardianInviteEmail, type EmailLang } from "../../../packages/shared/src/emails.ts";
import { corsHeaders, json, sha256 } from "../_shared/http.ts";
import { emailProvider, randomToken, siteUrl } from "../_shared/email.ts";
import { callerUser, serviceClient } from "../_shared/supabase.ts";

const EXPIRES_DAYS = 14;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findInvite(token: string) {
  const { data } = await serviceClient()
    .from("guardians_access")
    .select("id, student_id, relation, accepted_at, revoked_at, expires_at, guardian_profile_id, students(first_name)")
    .eq("token_hash", await sha256(token))
    .maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) < new Date()) return null;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const db = serviceClient();

    if (body.action === "invite") {
      const user = await callerUser(req);
      if (!user) return json({ error: "forbidden" }, 403);
      const email = String(body.email ?? "").trim().toLowerCase();
      const relation = body.relation === "teacher" ? "teacher" : "parent";
      if (!EMAIL_RE.test(email)) return json({ error: "invalid_email" }, 400);
      const { data: s } = await db.from("students").select("first_name, profiles(locale)").eq("profile_id", user.id).maybeSingle();
      if (!s) return json({ error: "not_a_student" }, 403);
      const { count } = await db.from("guardians_access").select("id", { count: "exact", head: true }).eq("student_id", user.id).is("revoked_at", null);
      if ((count ?? 0) >= 5) return json({ error: "too_many" }, 429);

      const token = randomToken();
      const { error } = await db.from("guardians_access").insert({
        student_id: user.id, guardian_email: email, relation, token_hash: await sha256(token),
        expires_at: new Date(Date.now() + EXPIRES_DAYS * 864e5).toISOString(),
      });
      if (error) throw error;
      const lang = ((s.profiles as unknown as { locale: string } | null)?.locale ?? "fr") as EmailLang;
      await emailProvider().send({
        to: email,
        ...guardianInviteEmail(lang, { firstName: s.first_name, relation, url: `${siteUrl()}/${lang}/guardian/invite/${token}`, expiresDays: EXPIRES_DAYS }),
      });
      return json({ invited: true });
    }

    if ((body.action === "info" || body.action === "accept") && typeof body.token === "string") {
      const invite = await findInvite(body.token);
      if (!invite) return json({ error: "invalid_or_expired" }, 404);
      const firstName = (invite.students as unknown as { first_name: string }).first_name;
      if (body.action === "info") return json({ firstName, relation: invite.relation, accepted: Boolean(invite.accepted_at) });

      const user = await callerUser(req);
      if (!user) return json({ error: "login_required" }, 401);
      const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "parent") return json({ error: "parent_account_required" }, 403);
      if (invite.guardian_profile_id && invite.guardian_profile_id !== user.id) return json({ error: "already_used" }, 409);
      await db.from("guardians_access").update({ guardian_profile_id: user.id, accepted_at: new Date().toISOString() }).eq("id", invite.id);
      return json({ firstName, accepted: true });
    }
    return json({ error: "bad_request" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "internal_error" }, 500);
  }
});
