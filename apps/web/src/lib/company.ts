import type { createClient } from "./supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Entreprise de l'utilisateur connecté (MVP : la première dont il est membre). */
export async function getCurrentCompany(supabase: Client) {
  const { data } = await supabase
    .from("company_members")
    .select("role, companies(id, name, verified_at, plan)")
    .limit(1)
    .maybeSingle();
  return data?.companies ? { ...data.companies, memberRole: data.role } : null;
}
