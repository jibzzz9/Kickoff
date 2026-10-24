"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_WEIGHTS,
  LANGUAGE_CODES,
  WEIGHT_KEYS,
  listingInputSchema,
  toCreateListingPayload,
  type Criterion,
  type CriterionKind,
  type Json,
  type WeightKey,
} from "@kickoff/shared";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Option = { id: string; name: string };
type Language = (typeof LANGUAGE_CODES)[number];
type FlagKey = "trial_done" | "aptitude_test" | "moped_license" | "volunteering";
const FLAG_KEYS: FlagKey[] = ["trial_done", "aptitude_test", "moped_license", "volunteering"];

const input = "mt-1 min-h-11 w-full rounded-card border border-ink/20 bg-white px-3";
const label = "block text-sm font-semibold";

export function ListingForm({ companyId, professions, communes }: { companyId: string; professions: Option[]; communes: Option[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [f, setF] = useState({
    professionId: "", communeId: "", address: "", title: "", description: "",
    startDate: "", placesCount: "1", contactName: "", contactEmail: "",
  });
  const [trialDates, setTrialDates] = useState<string[]>([""]);
  const [flags, setFlags] = useState<Record<FlagKey, CriterionKind | "">>({
    trial_done: "", aptitude_test: "", moped_license: "", volunteering: "",
  });
  const [minAverage, setMinAverage] = useState<{ kind: CriterionKind | ""; value: string }>({ kind: "", value: "4.5" });
  const [langs, setLangs] = useState<Record<CriterionKind, Language[]>>({ required: [], bonus: [] });
  const [weights, setWeights] = useState<Record<WeightKey, number>>(DEFAULT_WEIGHTS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function buildCriteria(): Criterion[] {
    const out: Criterion[] = [];
    for (const key of FLAG_KEYS) {
      const kind = flags[key];
      if (kind) out.push({ kind, key, value: true });
    }
    if (minAverage.kind) out.push({ kind: minAverage.kind, key: "min_average", value: Number(minAverage.value) });
    for (const kind of ["required", "bonus"] as const) {
      if (langs[kind].length) out.push({ kind, key: "languages", value: langs[kind] });
    }
    return out;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = listingInputSchema.safeParse({
      companyId,
      ...f,
      address: f.address || undefined,
      contactEmail: f.contactEmail || undefined,
      placesCount: Number(f.placesCount),
      trialDates: trialDates.filter(Boolean),
      criteria: buildCriteria(),
      weights,
    });
    if (!parsed.success) return setError(t("listingForm.error"));
    setBusy(true);
    const { data, error: err } = await createClient().rpc("create_listing", {
      p: toCreateListingPayload(parsed.data) as unknown as Json,
    });
    setBusy(false);
    if (err || !data) return setError(t("listingForm.errorServer"));
    router.push(`/dashboard/listings/${data}`);
    router.refresh();
  }

  const kindSelect = (value: CriterionKind | "", onChange: (v: CriterionKind | "") => void, id: string) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as CriterionKind | "")} className="min-h-11 rounded-card border border-ink/20 bg-white px-3">
      <option value="">—</option>
      <option value="required">{t("listingForm.sectionRequired")}</option>
      <option value="bonus">{t("listingForm.sectionBonus")}</option>
    </select>
  );

  const toggleLang = (kind: CriterionKind, code: Language) =>
    setLangs((s) => ({ ...s, [kind]: s[kind].includes(code) ? s[kind].filter((c) => c !== code) : [...s[kind], code] }));

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-10">
      <section className="space-y-4 rounded-xl2 bg-white p-6">
        <h2 className="text-xl">{t("listingForm.sectionInfo")}</h2>
        <label className={label}>{t("listingForm.profession")}
          <select required value={f.professionId} onChange={set("professionId")} className={input}>
            <option value="">{t("listingForm.choose")}</option>
            {professions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className={label}>{t("listingForm.listingTitle")}
          <input required maxLength={120} value={f.title} onChange={set("title")} className={input} />
          <span className="text-xs font-normal">{t("listingForm.listingTitleHint")}</span>
        </label>
        <label className={label}>{t("listingForm.description")}
          <textarea required minLength={20} maxLength={4000} rows={6} value={f.description} onChange={set("description")} className={`${input} py-2`} />
          <span className="text-xs font-normal">{t("listingForm.descriptionHint")}</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>{t("listingForm.commune")}
            <select required value={f.communeId} onChange={set("communeId")} className={input}>
              <option value="">{t("listingForm.choose")}</option>
              {communes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className={label}>{t("listingForm.address")}
            <input value={f.address} onChange={set("address")} className={input} />
          </label>
          <label className={label}>{t("listingForm.startDate")}
            <input required type="date" value={f.startDate} onChange={set("startDate")} className={input} />
          </label>
          <label className={label}>{t("listingForm.placesCount")}
            <input required type="number" min={1} max={50} value={f.placesCount} onChange={set("placesCount")} className={input} />
          </label>
          <label className={label}>{t("listingForm.contactName")}
            <input required value={f.contactName} onChange={set("contactName")} className={input} />
          </label>
          <label className={label}>{t("listingForm.contactEmail")}
            <input type="email" value={f.contactEmail} onChange={set("contactEmail")} className={input} />
          </label>
        </div>
        <fieldset>
          <legend className={label}>{t("listingForm.trialDates")}</legend>
          <div className="mt-1 space-y-2">
            {trialDates.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input type="date" value={d} aria-label={t("listingForm.trialDates")} className={input}
                  onChange={(e) => setTrialDates((s) => s.map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setTrialDates((s) => s.filter((_, j) => j !== i))}>
                  {t("listingForm.remove")}
                </button>
              </div>
            ))}
            <button type="button" className="min-h-11 text-sm font-bold underline" onClick={() => setTrialDates((s) => [...s, ""])}>
              + {t("listingForm.addTrialDate")}
            </button>
          </div>
        </fieldset>
      </section>

      <section className="space-y-4 rounded-xl2 bg-white p-6">
        <h2 className="text-xl">{t("listingForm.sectionRequired")} / {t("listingForm.sectionBonus")}</h2>
        <p className="text-sm">{t("listingForm.sectionRequiredHint")} {t("listingForm.sectionBonusHint")}</p>
        {FLAG_KEYS.map((key) => (
          <div key={key} className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
            <label htmlFor={`crit-${key}`}>{t(`criteria.${key}`)}</label>
            {kindSelect(flags[key], (v) => setFlags((s) => ({ ...s, [key]: v })), `crit-${key}`)}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
          <label htmlFor="crit-min_average">{t("criteria.min_average")}</label>
          <div className="flex items-center gap-2">
            {minAverage.kind && (
              <input type="number" min={1} max={6} step={0.1} value={minAverage.value} aria-label={t("listingForm.minAverageValue")}
                onChange={(e) => setMinAverage((s) => ({ ...s, value: e.target.value }))}
                className="min-h-11 w-24 rounded-card border border-ink/20 bg-white px-3" />
            )}
            {kindSelect(minAverage.kind, (v) => setMinAverage((s) => ({ ...s, kind: v })), "crit-min_average")}
          </div>
        </div>
        {(["required", "bonus"] as const).map((kind) => (
          <fieldset key={kind}>
            <legend className="font-semibold">{t(kind === "required" ? "listingForm.languagesRequired" : "listingForm.languagesBonus")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGE_CODES.map((code) => (
                <label key={code} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 ${langs[kind].includes(code) ? "border-violet bg-violet/10" : "border-ink/20"}`}>
                  <input type="checkbox" className="sr-only" checked={langs[kind].includes(code)} onChange={() => toggleLang(kind, code)} />
                  {t(`languages.${code}`)}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="space-y-4 rounded-xl2 bg-white p-6">
        <h2 className="text-xl">{t("listingForm.sectionWeights")}</h2>
        <p className="text-sm">{t("listingForm.sectionWeightsHint")}</p>
        {WEIGHT_KEYS.map((key) => (
          <fieldset key={key} className="flex flex-wrap items-center justify-between gap-2">
            <legend className="sr-only">{t(`weights.${key}`)}</legend>
            <span aria-hidden>{t(`weights.${key}`)}</span>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <label key={n} className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 ${weights[key] === n ? "border-ink bg-lime" : "border-ink/20"}`}>
                  <input type="radio" name={`w-${key}`} className="sr-only" checked={weights[key] === n} onChange={() => setWeights((s) => ({ ...s, [key]: n }))} />
                  {t(`weights.${n}`)}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      {error && <p role="alert" className="text-coral">{error}</p>}
      <button disabled={busy} className="min-h-11 w-full rounded-card bg-lime px-6 py-3 text-lg font-bold text-ink disabled:opacity-60">
        {busy ? t("common.loading") : t("listingForm.submit")}
      </button>
    </form>
  );
}
