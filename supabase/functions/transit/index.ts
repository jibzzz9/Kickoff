// Edge Function `transit` : temps de trajet en transports publics entre la commune de l'élève et celle d'une place.
// API publique gratuite transport.opendata.ch, résultat mis en cache 30 jours par paire de communes.
import { corsHeaders, json } from "../_shared/http.ts";
import { serviceClient, userClient } from "../_shared/supabase.ts";

const API = "https://transport.opendata.ch/v1/connections";
const CACHE_DAYS = 30;

/** Prochain jour ouvrable (heure suisse), pour un trajet du matin représentatif. */
function nextWeekday() {
  const d = new Date(Date.now() + 864e5);
  while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const minutes = (duration: string) => {
  const m = /(\d+)d(\d+):(\d+):(\d+)/.exec(duration);
  return m ? Number(m[1]) * 1440 + Number(m[2]) * 60 + Number(m[3]) : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { listingId } = await req.json().catch(() => ({}));
    if (typeof listingId !== "string") return json({ error: "bad_request" }, 400);
    const sb = userClient(req);
    const [{ data: student }, { data: listing }] = await Promise.all([
      sb.from("students").select("commune_id").maybeSingle(),
      sb.from("listing_cards").select("commune_id").eq("id", listingId).maybeSingle(),
    ]);
    if (!student?.commune_id || !listing?.commune_id) return json({ minutes: null });
    if (student.commune_id === listing.commune_id) return json({ minutes: 0, sameCommune: true });

    const db = serviceClient();
    const { data: cached } = await db.from("transit_cache").select("minutes, transfers, fetched_at")
      .eq("from_commune_id", student.commune_id).eq("to_commune_id", listing.commune_id).maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_DAYS * 864e5) {
      return json({ minutes: cached.minutes, transfers: cached.transfers });
    }

    const { data: communes } = await db.from("communes").select("id, station_id").in("id", [student.commune_id, listing.commune_id]);
    const from = communes?.find((c) => c.id === student.commune_id)?.station_id;
    const to = communes?.find((c) => c.id === listing.commune_id)?.station_id;
    if (!from || !to) return json({ minutes: null });

    const url = `${API}?from=${from}&to=${to}&date=${nextWeekday()}&time=07:00&limit=4&fields[]=connections/duration&fields[]=connections/transfers`;
    const res = await fetch(url);
    if (!res.ok) return json({ minutes: null });
    const data = await res.json();
    const best = (data.connections ?? [])
      .map((c: { duration: string; transfers: number }) => ({ minutes: minutes(c.duration), transfers: c.transfers }))
      .filter((c: { minutes: number | null }) => c.minutes !== null)
      .sort((a: { minutes: number }, b: { minutes: number }) => a.minutes - b.minutes)[0];
    if (!best) return json({ minutes: null });

    await db.from("transit_cache").upsert({
      from_commune_id: student.commune_id, to_commune_id: listing.commune_id,
      minutes: best.minutes, transfers: best.transfers, fetched_at: new Date().toISOString(),
    });
    return json(best);
  } catch (e) {
    console.error(e);
    return json({ minutes: null });
  }
});
