"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Badge, MatchResult } from "@kickoff/shared";

export type CompanyMatch = Pick<MatchResult, "score" | "segments" | "badge" | "complete" | "missingInfo" | "criteria" | "strengths">;

const BADGE_STYLE: Record<Badge, { dot: string; bar: string; chip: string }> = {
  very_interesting: { dot: "🟢", bar: "bg-success", chip: "bg-success/15" },
  interesting: { dot: "🔵", bar: "bg-[#3B82F6]", chip: "bg-[#3B82F6]/15" },
  to_discover: { dot: "🟡", bar: "bg-amber", chip: "bg-amber/25" },
  incomplete: { dot: "⚪", bar: "bg-ink/30", chip: "bg-ink/10" },
};

/** Badge + jauge 5 segments + ligne d'explication. Visible uniquement côté entreprise. */
export function Gauge({ match }: { match: CompanyMatch }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const style = BADGE_STYLE[match.badge];

  const strengths = match.strengths.map((s) => {
    const params = { ...(s.params ?? {}) };
    if (s.key === "languages_match" && typeof params.languages === "string") {
      params.languages = params.languages.split(",").filter(Boolean).map((l) => t(`languages.${l}`)).join(", ");
    }
    return t(`gauge.strengths.${s.key}`, params);
  });

  return (
    <section className="mt-4 border-t border-ink/10 pt-4" aria-label={t(`gauge.badge.${match.badge}`)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${style.chip}`}>
          <span aria-hidden>{style.dot}</span> {t(`gauge.badge.${match.badge}`)}
        </span>
        <div className="flex gap-1" role="img" aria-label={t("gauge.segments", { count: match.segments })}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`h-2.5 w-7 rounded-full ${i <= match.segments ? style.bar : "bg-ink/10"}`} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm">{strengths.length ? strengths.join(" · ") : t("gauge.noStrength")}</p>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-1 min-h-11 text-sm font-bold underline">
        {open ? t("gauge.hideDetail") : t("gauge.detail")}
      </button>
      {open && (
        <div className="mt-2 grid gap-4 rounded-card bg-surface p-4 text-sm sm:grid-cols-2">
          {match.criteria.length > 0 && (
            <div>
              <h4 className="font-bold">{t("gauge.criteriaTitle")}</h4>
              <ul className="mt-1 space-y-1">
                {match.criteria.map((c) => (
                  <li key={`${c.kind}-${c.key}`}>
                    <span aria-hidden>{c.status === "met" ? "✓" : c.status === "unknown" ? "?" : "○"}</span>{" "}
                    {t(c.kind === "required" ? "listingForm.sectionRequired" : "listingForm.sectionBonus")} · {t(`criteria.${c.key}`)} :{" "}
                    <strong>{t(`gauge.status.${c.status}`)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {match.missingInfo.length > 0 && (
            <div>
              <h4 className="font-bold">{t("gauge.missingTitle")}</h4>
              <p className="mt-1">{match.missingInfo.map((m) => t(`gauge.missing.${m}`)).join(", ")}</p>
            </div>
          )}
          <p className="text-ink/60 sm:col-span-2">{t("gauge.humanDecides")}</p>
        </div>
      )}
    </section>
  );
}
