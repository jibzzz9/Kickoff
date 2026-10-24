import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationsLive } from "./applications-live";

export default async function ListingPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = await createClient();

  // RLS : renvoie l'annonce uniquement si l'utilisateur est membre de l'entreprise.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, status, start_date, places_count, professions(name_fr, name_de), communes(name), listing_criteria(kind, key, value)")
    .eq("id", id)
    .maybeSingle();
  if (!listing) notFound();

  const [{ data: cards }, { data: professions }] = await Promise.all([
    supabase.from("candidate_cards").select("*").eq("listing_id", id).order("created_at", { ascending: true }),
    supabase.from("professions").select("code, name_fr, name_de"),
  ]);
  const professionNames = Object.fromEntries((professions ?? []).map((p) => [p.code, locale === "de" ? p.name_de : p.name_fr]));
  const professionName = listing.professions ? (locale === "de" ? listing.professions.name_de : listing.professions.name_fr) : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm font-bold underline">{t("common.back")}</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl">{listing.title}</h1>
        <span className="rounded-full bg-white px-3 py-1 text-sm">{t(`listingStatus.${listing.status}`)}</span>
      </div>
      <p className="mt-2 text-ink/70">
        {professionName} · {listing.communes?.name} ·{" "}
        {t("dashboard.startDate", { date: format.dateTime(new Date(listing.start_date), { dateStyle: "long" }) })} ·{" "}
        {t("dashboard.places", { count: listing.places_count })}
      </p>
      {listing.listing_criteria.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.listing_criteria.map((c) => (
            <span key={`${c.kind}-${c.key}`} className={`rounded-full px-3 py-1 text-sm ${c.kind === "required" ? "bg-ink text-white" : "bg-white"}`}>
              {t(c.kind === "required" ? "listingForm.sectionRequired" : "listingForm.sectionBonus")} : {t(`criteria.${c.key}`)}
              {c.key === "min_average" && ` ≥ ${String(c.value)}`}
              {c.key === "languages" && Array.isArray(c.value) && ` (${c.value.map((l) => t(`languages.${String(l)}`)).join(", ")})`}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-2xl">{t("listingPage.applications")}</h2>
      <p className="text-sm text-ink/70">{t("listingPage.applicationsHint")}</p>
      <ApplicationsLive listingId={listing.id} initial={cards ?? []} professionNames={professionNames} />
    </main>
  );
}
