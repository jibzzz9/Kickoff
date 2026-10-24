import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@kickoff/ui-tokens";

export default function AppLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.violet, tabBarLabelStyle: { fontWeight: "700" } }}>
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.places"), tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="applications"
        options={{ title: t("tabs.applications"), tabBarIcon: ({ color, size }) => <Ionicons name="paper-plane" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("tabs.profile"), tabBarIcon: ({ color, size }) => <Ionicons name="person" color={String(color)} size={size} /> }}
      />
      <Tabs.Screen name="listing/[id]" options={{ href: null, headerShown: true, title: "" }} />
    </Tabs>
  );
}
