import { useCallback, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { notificationText, type Lang } from "@kickoff/shared";
import { palette as c } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { formatDate } from "../../src/lib/format";
import { Divider, GUTTER, Txt, type IconName } from "../../src/ui";
import { Ridges } from "../../src/ui/Ridge";

type Row = { id: string; type: string; params: Record<string, string>; read_at: string | null; created_at: string };

const ICON: Record<string, IconName> = {
  invitation: "calendar", checkup_ready: "sparkles", offer: "trophy", message: "chatbubble", not_this_time: "mail",
  waitlist: "hourglass", trial_feedback: "chatbox-ellipses", reminder: "alarm",
};

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("id, type, params, read_at, created_at").order("created_at", { ascending: false }).limit(50);
    setRows((data ?? []) as Row[]);
    // Ouvrir la liste marque tout comme lu.
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      style={{ backgroundColor: c.snow }}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={<View style={{ backgroundColor: c.sky, marginBottom: 4 }}><Ridges height={26} /></View>}
      ItemSeparatorComponent={() => <Divider inset={GUTTER + 56} />}
      ListEmptyComponent={<Txt variant="small" style={{ paddingHorizontal: GUTTER, paddingTop: 12 }}>{t("notifications.empty")}</Txt>}
      renderItem={({ item }) => {
        const n = notificationText(i18n.language as Lang, item.type, item.params);
        const unread = !item.read_at;
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (item.type === "checkup_ready") router.push("/coach");
              else if (item.params.application_id) router.push(`/application/${item.params.application_id}`);
            }}
            style={({ pressed }) => ({ flexDirection: "row", gap: 16, paddingHorizontal: GUTTER, paddingVertical: 16, backgroundColor: pressed ? c.mist : c.snow })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: unread ? c.apricotSoft : c.mist, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={ICON[item.type] ?? "notifications"} size={19} color={c.night} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <Txt variant="subheading" style={{ flex: 1 }}>{n.title}</Txt>
                <Txt variant="micro" style={{ paddingTop: 3 }}>{formatDate(item.created_at, { day: "numeric", month: "short" })}</Txt>
              </View>
              <Txt variant="small" style={{ color: c.night }}>{n.body}</Txt>
            </View>
            {unread && <View accessibilityLabel={t("notifications.unread")} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.apricot, marginTop: 6 }} />}
          </Pressable>
        );
      }}
    />
  );
}
