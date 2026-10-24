import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompany } from "@/lib/company";
import { ListingForm } from "./listing-form";

export default async function NewListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const supabase = await createClient();
  const company = await getCurrentCompany(supabase);
  if (!company) return redirect({ href: "/login", locale });

  const [{ data: professions }, { data: communes }] = await Promise.all([
    supabase.from("professions").select("id, name_fr, name_de").order("name_fr"),
    supabase.from("communes").select("id, name").order("name"),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm font-bold underline">{t("common.back")}</Link>
      <h1 className="mt-4 text-3xl">{t("listingForm.title")}</h1>
      <ListingForm
        companyId={company.id}
        professions={(professions ?? []).map((p) => ({ id: p.id, name: locale === "de" ? p.name_de : p.name_fr }))}
        communes={communes ?? []}
      />
    </main>
  );
}
