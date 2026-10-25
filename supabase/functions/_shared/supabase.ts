import { createClient } from "npm:@supabase/supabase-js@2";

/** Client qui agit avec les droits de l'utilisateur appelant (RLS appliquée). */
export function userClient(req: Request) {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
}

/** Client serveur (contourne la RLS) : uniquement pour écrire ce que le client n'a pas le droit d'écrire. */
export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

/** Utilisateur connecté qui appelle la fonction (null si anonyme ou jeton invalide). */
export async function callerUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await serviceClient().auth.getUser(token);
  return data.user ?? null;
}

export const isServiceCall = (req: Request) =>
  (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "") === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
