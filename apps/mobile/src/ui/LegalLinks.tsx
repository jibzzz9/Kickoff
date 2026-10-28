import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";
import { palette as c } from "@kickoff/ui-tokens";
import { Txt } from "./index";

const WEB = (process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Liens vers les textes légaux (pages web, brouillons à valider). */
export function LegalLinks() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "de" ? "de" : "fr";
  const link = (path: string, label: string) => (
    <Txt
      variant="smallStrong"
      accessibilityRole="link"
      style={{ color: c.rhone, textDecorationLine: "underline", paddingVertical: 10 }}
      onPress={() => void Linking.openURL(`${WEB}/${lang}/legal/${path}`)}
    >
      {label}
    </Txt>
  );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20 }}>
      {link("terms", t("legal.terms"))}
      {link("privacy", t("legal.privacy"))}
    </View>
  );
}
