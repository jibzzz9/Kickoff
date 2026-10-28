import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { mobileFonts, palette as c } from "@kickoff/ui-tokens";

/** Pile de navigation : les onglets, puis les écrans de détail par-dessus (avec bouton Retour). */
export default function AppLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerTintColor: c.night,
        headerBackTitle: t("common.back"),
        // L'en-tête prend la couleur du ciel : il se prolonge dans le haut de chaque fiche.
        headerStyle: { backgroundColor: c.sky },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: mobileFonts.bold, fontSize: 17, color: c.night },
        headerBackTitleStyle: { fontFamily: mobileFonts.semiBold },
        contentStyle: { backgroundColor: c.snow },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: "" }} />
      <Stack.Screen name="application/[id]" options={{ title: "" }} />
      <Stack.Screen name="notifications" options={{ title: t("notifications.title") }} />
    </Stack>
  );
}
