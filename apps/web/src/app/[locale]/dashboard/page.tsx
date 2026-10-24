import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return redirect({ href: "/login", locale });

  // RLS : seule l'entreprise de l'utilisateur est renvoyée.
  const { data: company } = await supabase.from("companies").select("name, verified_at").single();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">{t("welcome", { company: company?.name ?? "" })}</h1>
      {!company?.verified_at && <p className="mt-4 rounded-card bg-amber/30 p-4">{t("pending")}</p>}
      <p className="mt-6">{t("empty")}</p>
      <LogoutButton />
    </main>
  );
}
