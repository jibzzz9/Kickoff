import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { LEGAL, LEGAL_DRAFT_DATE } from "@/content/legal";

export default async function LegalPage({ params }: { params: Promise<{ locale: "fr" | "de"; doc: string }> }) {
  const { locale, doc } = await params;
  if (doc !== "terms" && doc !== "privacy") notFound();
  const t = await getTranslations("legal");
  const format = await getFormatter();
  const content = LEGAL[locale][doc];
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p role="note" className="rounded-card bg-coral/15 p-4 font-bold text-ink">{t("draft")}</p>
      <h1 className="mt-6 text-3xl">{content.title}</h1>
      <p className="text-sm text-ink/60">{t("updated", { date: format.dateTime(new Date(LEGAL_DRAFT_DATE), { dateStyle: "long" }) })}</p>
      {content.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="text-xl">{s.heading}</h2>
          {s.body.map((p) => <p key={p} className="mt-2 leading-relaxed">{p}</p>)}
        </section>
      ))}
    </main>
  );
}
