import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as never) ? (requested as string) : routing.defaultLocale;
  // Plateforme suisse : toutes les dates et heures sont affichées à l'heure de Zurich.
  return { locale, timeZone: "Europe/Zurich", messages: (await import(`../../messages/${locale}.json`)).default };
});
