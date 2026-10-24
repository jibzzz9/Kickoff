"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const t = useTranslations("common");
  const router = useRouter();
  return (
    <button
      className="mt-8 min-h-11 rounded-card border border-ink px-6 py-3 font-bold"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      {t("logout")}
    </button>
  );
}
