import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "../dashboard/logout-button";

/** Espace parent / enseignant : lecture seule (la RLS ne renvoie que les élèves qui ont invité cette personne). */
export default async function GuardianDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return redirect({ href: "/login", locale });

  const { data: students } = await supabase.from("students").select("profile_id, first_name").neq("profile_id", auth.user.id);
  const ids = (students ?? []).map((s) => s.profile_id);
  const [{ data: apps }, { data: appts }, { data: reports }] = ids.length
    ? await Promise.all([
        supabase.from("applications").select("id, student_id, status, created_at, listing_id").in("student_id", ids).order("created_at", { ascending: false }),
        supabase.from("appointments").select("id, kind, status, location, application_id, chosen_slot_id, appointment_slots!appointment_slots_appointment_id_fkey(id, starts_at)").eq("status", "scheduled"),
        supabase.from("checkup_reports").select("student_id, period_end, content").in("student_id", ids).order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const listingIds = [...new Set((apps ?? []).map((a) => a.listing_id))];
  const { data: listings } = listingIds.length ? await supabase.from("listing_cards").select("id, title, company_name").in("id", listingIds) : { data: [] };
  const listing = (id: string) => listings?.find((l) => l.id === id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{t("guardian.dashboardTitle")}</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-ink/70">{t("guardian.readOnly")}</p>
      {!students?.length && <p className="mt-8 rounded-card bg-white p-6">{t("guardian.none")}</p>}
      {(students ?? []).map((s) => {
        const myApps = (apps ?? []).filter((a) => a.student_id === s.profile_id);
        const myAppts = (appts ?? []).filter((a) => myApps.some((x) => x.id === a.application_id));
        const report = (reports ?? []).find((r) => r.student_id === s.profile_id);
        const stats = (report?.content as { stats?: Record<string, number> } | undefined)?.stats;
        return (
          <section key={s.profile_id} className="mt-8 space-y-4 rounded-xl2 bg-white p-6">
            <h2 className="text-2xl">{s.first_name}</h2>
            <div>
              <h3 className="font-bold">{t("guardian.applications")}</h3>
              {myApps.length === 0 ? <p className="text-sm text-ink/60">{t("guardian.noApplications")}</p> : (
                <ul className="mt-1 space-y-1 text-sm">
                  {myApps.map((a) => (
                    <li key={a.id}>
                      <span className="rounded-full bg-surface px-2 py-0.5 font-semibold">{t(`guardian.status.${a.status}`)}</span>{" "}
                      {listing(a.listing_id)?.company_name} — {listing(a.listing_id)?.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-bold">{t("guardian.appointments")}</h3>
              {myAppts.length === 0 ? <p className="text-sm text-ink/60">{t("guardian.noAppointments")}</p> : (
                <ul className="mt-1 space-y-1 text-sm">
                  {myAppts.map((a) => {
                    const slot = a.appointment_slots.find((x) => x.id === a.chosen_slot_id);
                    const app = myApps.find((x) => x.id === a.application_id);
                    return (
                      <li key={a.id}>
                        {t(`appointment.${a.kind}`)} — {app && listing(app.listing_id)?.company_name}
                        {slot && ` · ${format.dateTime(new Date(slot.starts_at), { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`}
                        {a.location && ` · ${a.location}`}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-bold">{t("guardian.checkup")}</h3>
              {stats ? (
                <p className="text-sm">
                  {format.dateTime(new Date(report!.period_end), { dateStyle: "long" })} ·{" "}
                  {t("guardian.checkupStats", { applications: stats.applications ?? 0, invitations: stats.invitations ?? 0, offers: stats.offers ?? 0 })}
                </p>
              ) : <p className="text-sm text-ink/60">{t("guardian.noCheckup")}</p>}
            </div>
          </section>
        );
      })}
    </main>
  );
}
