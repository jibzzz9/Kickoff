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
