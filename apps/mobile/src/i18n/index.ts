import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@kickoff/shared";
import fr from "./locales/fr";
import de from "./locales/de";

const device = getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
const initial: Locale = (LOCALES as readonly string[]).includes(device) ? (device as Locale) : DEFAULT_LOCALE;

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, de: { translation: de } },
  lng: initial,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export default i18n;
