import { getFormatter, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompany } from "@/lib/company";
import { LogoutButton } from "./logout-button";

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return redirect({ href: "/login", locale });

  const company = await getCurrentCompany(supabase);
  // RLS : seules les annonces de l'entreprise de l'utilisateur sont renvoyées.
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, start_date, places_count, applications(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{t("dashboard.welcome", { company: company?.name ?? "" })}</h1>
        <LogoutButton />
      </div>
      {!company?.verified_at && <p className="mt-4 rounded-card bg-amber/30 p-4">{t("dashboard.pending")}</p>}

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-2xl">{t("dashboard.listingsTitle")}</h2>
        <Link href="/dashboard/listings/new" className="min-h-11 rounded-card bg-lime px-5 py-3 font-bold text-ink">
          {t("dashboard.newListing")}
        </Link>
      </div>

      {!listings?.length ? (
        <p className="mt-6 rounded-card bg-white p-6">{t("dashboard.noListings")}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {listings.map((l) => (
            <li key={l.id}>
              <Link href={`/dashboard/listings/${l.id}`} className="block rounded-card bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-bold">{l.title}</span>
                  <span className="rounded-full bg-surface px-3 py-1 text-sm">{t(`listingStatus.${l.status}`)}</span>
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {t("dashboard.startDate", { date: format.dateTime(new Date(l.start_date), { dateStyle: "long" }) })} ·{" "}
                  {t("dashboard.places", { count: l.places_count })}
                </p>
                <p className="mt-2 font-semibold text-violet">
                  {t("dashboard.applicationsCount", { count: l.applications[0]?.count ?? 0 })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
