// Edge Function `push` : envoie une notification push (Expo, gratuit) pour une notification enregistrée.
// Appelée uniquement par la base (trigger notifications_push via pg_net) avec la clé serveur.
import { notificationText, type Lang } from "../../../packages/shared/src/texts.ts";
import { json } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return json({ error: "forbidden" }, 403);

  const { notification_id } = await req.json().catch(() => ({}));
  if (typeof notification_id !== "string") return json({ error: "bad_request" }, 400);

  const db = serviceClient();
  const { data: n } = await db.from("notifications").select("id, profile_id, type, params, pushed_at").eq("id", notification_id).maybeSingle();
  if (!n || n.pushed_at) return json({ sent: 0 });

  const [{ data: profile }, { data: tokens }] = await Promise.all([
    db.from("profiles").select("locale").eq("id", n.profile_id).single(),
    db.from("push_tokens").select("token").eq("profile_id", n.profile_id),
  ]);
  if (!tokens?.length) return json({ sent: 0 });

  const { title, body } = notificationText((profile?.locale ?? "fr") as Lang, n.type, n.params as Record<string, string>);
  const messages = tokens.map((t) => ({ to: t.token, title, body, sound: "default", data: { type: n.type, params: n.params } }));

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
  const result = await res.json().catch(() => ({}));

  // Jetons invalides (application désinstallée) : on les supprime.
  const tickets: { status: string; details?: { error?: string } }[] = result.data ?? [];
  const invalid = tickets.flatMap((t, i) => (t.details?.error === "DeviceNotRegistered" ? [tokens[i]!.token] : []));
  if (invalid.length) await db.from("push_tokens").delete().in("token", invalid);

  await db.from("notifications").update({ pushed_at: new Date().toISOString() }).eq("id", n.id);
  return json({ sent: tickets.filter((t) => t.status === "ok").length });
});
