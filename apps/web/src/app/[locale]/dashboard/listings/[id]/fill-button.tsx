"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

/** « Place pourvue » : action humaine explicite, avec confirmation. */
export function FillButton({ listingId }: { listingId: string }) {
  const t = useTranslations("actions");
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!confirm) {
    return <button onClick={() => setConfirm(true)} className="min-h-11 rounded-card border border-ink px-4 font-bold">{t("filled")}</button>;
  }
  return (
    <div className="mt-4 w-full rounded-card bg-amber/25 p-4">
      <p>{t("filledConfirm")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy} className="min-h-11 rounded-card bg-ink px-4 font-bold text-white disabled:opacity-60"
          onClick={async () => {
            setBusy(true);
            await createClient().rpc("company_mark_filled", { p_listing: listingId });
            setBusy(false);
            setConfirm(false);
            router.refresh();
          }}>{t("filledYes")}</button>
        <button onClick={() => setConfirm(false)} className="min-h-11 px-4 underline">{t("cancel")}</button>
      </div>
    </div>
  );
}
