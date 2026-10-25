import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@kickoff/ui-tokens";

/** Pile de navigation : les onglets, puis les écrans de détail par-dessus (avec bouton Retour). */
export default function AppLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerTintColor: colors.ink, headerBackTitle: t("common.back"), contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: "" }} />
      <Stack.Screen name="application/[id]" options={{ title: "" }} />
      <Stack.Screen name="notifications" options={{ title: t("notifications.title") }} />
    </Stack>
  );
}
