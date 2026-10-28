import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { mobileFonts, palette as c } from "@kickoff/ui-tokens";

/** Bandeau visible uniquement dans la version démo (données fictives, rien n'est enregistré). */
export function DemoBanner() {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="text" style={{ backgroundColor: c.night, paddingVertical: 6, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.apricot }} />
      <Text style={{ color: c.snow, fontFamily: mobileFonts.semiBold, fontSize: 12 }}>{t("demo.banner")}</Text>
    </View>
  );
}
