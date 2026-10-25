import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "@kickoff/ui-tokens";

/** Bandeau visible uniquement dans la version démo (données fictives, rien n'est enregistré). */
export function DemoBanner() {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="text" style={{ backgroundColor: colors.lime, paddingVertical: 4, paddingHorizontal: 12 }}>
      <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 12, textAlign: "center" }}>{t("demo.banner")}</Text>
    </View>
  );
}
