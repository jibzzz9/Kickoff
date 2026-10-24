import i18n from "../i18n";

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(i18n.language === "de" ? "de-CH" : "fr-CH", opts).format(new Date(iso));
}

export function professionName(p: { profession_name_fr: string | null; profession_name_de: string | null }) {
  return (i18n.language === "de" ? p.profession_name_de : p.profession_name_fr) ?? "";
}
