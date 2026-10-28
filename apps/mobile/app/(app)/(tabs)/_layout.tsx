import { View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { mobileFonts, palette as c } from "@kickoff/ui-tokens";
import type { IconName } from "../../../src/ui";

const TABS: { name: string; label: string; icon: IconName; iconOn: IconName }[] = [
  { name: "index", label: "tabs.places", icon: "compass-outline", iconOn: "compass" },
  { name: "applications", label: "tabs.applications", icon: "paper-plane-outline", iconOn: "paper-plane" },
  { name: "appointments", label: "tabs.appointments", icon: "calendar-clear-outline", iconOn: "calendar-clear" },
  { name: "coach", label: "tabs.coach", icon: "sparkles-outline", iconOn: "sparkles" },
  { name: "profile", label: "tabs.profile", icon: "person-outline", iconOn: "person" },
];

export default function AppLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.night,
        tabBarInactiveTintColor: c.stone,
        tabBarStyle: { backgroundColor: c.snow, borderTopColor: c.line, height: 74 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelStyle: { fontFamily: mobileFonts.semiBold, fontSize: 11, letterSpacing: -0.2, marginTop: 3 },
        tabBarIconStyle: { width: 56, height: 28 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.label),
            // Onglet actif : l'icône pleine posée sur une pastille abricot.
            tabBarIcon: ({ focused, color }) => (
              <View style={{ width: 52, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: focused ? c.apricotSoft : "transparent" }}>
                <Ionicons name={focused ? tab.iconOn : tab.icon} size={21} color={String(color)} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
