import { Linking, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { styles } from "./index";

const WEB = (process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Liens vers les textes légaux (pages web, brouillons à valider). */
export function LegalLinks() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "de" ? "de" : "fr";
  return (
    <Text style={[styles.muted, { marginTop: 8 }]}>
      <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL(`${WEB}/${lang}/legal/terms`)}>{t("legal.terms")}</Text>
      {"  ·  "}
      <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL(`${WEB}/${lang}/legal/privacy`)}>{t("legal.privacy")}</Text>
    </Text>
  );
}
