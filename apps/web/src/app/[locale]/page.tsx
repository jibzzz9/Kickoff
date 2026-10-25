import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("home");
  return (
    <main className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg">{t("subtitle")}</p>
      <div className="mt-8 flex gap-3">
        <Link href="/signup" className="min-h-11 rounded-card bg-lime px-6 py-3 font-bold text-ink">{t("signup")}</Link>
        <Link href="/login" className="min-h-11 rounded-card border border-ink px-6 py-3 font-bold">{t("login")}</Link>
      </div>
      <footer className="mt-16 flex gap-4 text-sm text-ink/60">
        <Link href="/legal/terms" className="underline">{useTranslations("footer")("terms")}</Link>
        <Link href="/legal/privacy" className="underline">{useTranslations("footer")("privacy")}</Link>
      </footer>
    </main>
  );
}
