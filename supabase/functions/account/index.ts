// Edge Function `account` : droits nLPD de l'utilisateur connecté.
//  - export : toutes ses données, en JSON (droit d'accès)
//  - delete : suppression réelle du compte, des fichiers et des données liées (droit à l'effacement)
import { corsHeaders, json } from "../_shared/http.ts";
import { callerUser, serviceClient } from "../_shared/supabase.ts";

const BUCKET = "student-documents";

async function exportData(userId: string) {
  const db = serviceClient();
  const one = async (table: string, column: string) => (await db.from(table).select("*").eq(column, userId)).data ?? [];
  const profile = await one("profiles", "id");
  const student = await one("students", "profile_id");
  const applications = await one("applications", "student_id");
  const appIds = applications.map((a: { id: string }) => a.id);
  const inApps = async (table: string) => (appIds.length ? (await db.from(table).select("*").in("application_id", appIds)).data ?? [] : []);
  const memberships = await one("company_members", "profile_id");
  return {
    exported_at: new Date().toISOString(),
    profile,
    student,
    documents: await one("student_documents", "student_id"),
    applications,
    messages: await inApps("messages"),
    appointments: await inApps("appointments"),
    checkup_reports: await one("checkup_reports", "student_id"),
    guardians_access: (await one("guardians_access", "student_id")).map(({ token_hash: _t, ...g }: Record<string, unknown>) => g),
    followed_students: (await one("guardians_access", "guardian_profile_id")).map(({ token_hash: _t, ...g }: Record<string, unknown>) => g),
    notifications: await one("notifications", "profile_id"),
    company_memberships: memberships,
  };
}

async function deleteAccount(userId: string) {
  const db = serviceClient();
  // 1. Fichiers de l'élève (CV, vidéo…)
  const { data: files } = await db.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (files?.length) await db.storage.from(BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
  // 2. Entreprise dont il est le dernier membre : supprimée avec ses annonces
  const { data: memberships } = await db.from("company_members").select("company_id").eq("profile_id", userId);
  for (const m of memberships ?? []) {
    const { count } = await db.from("company_members").select("profile_id", { count: "exact", head: true }).eq("company_id", m.company_id);
    if ((count ?? 0) <= 1) await db.from("companies").delete().eq("id", m.company_id);
  }
  // 3. Compte : la suppression en cascade efface profil, dossier, candidatures, messages, notifications…
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await callerUser(req);
    if (!user) return json({ error: "forbidden" }, 403);
    const body = await req.json().catch(() => ({}));
    if (body.action === "export") return json(await exportData(user.id));
    if (body.action === "delete" && body.confirm === "DELETE") {
      await deleteAccount(user.id);
      return json({ deleted: true });
    }
    return json({ error: "bad_request" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "internal_error" }, 500);
  }
});
