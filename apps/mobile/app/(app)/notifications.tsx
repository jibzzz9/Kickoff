import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { notificationText, type Lang } from "@kickoff/shared";
import { colors, spacing } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { formatDate } from "../../src/lib/format";
import { styles } from "../../src/ui";

type Row = { id: string; type: string; params: Record<string, string>; read_at: string | null; created_at: string };

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
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surface, flexGrow: 1 }}
      ListEmptyComponent={<Text style={styles.muted}>{t("notifications.empty")}</Text>}
      renderItem={({ item }) => {
        const n = notificationText(i18n.language as Lang, item.type, item.params);
        return (
          <Pressable
            accessibilityRole="button"
            style={[styles.card, !item.read_at && { borderLeftWidth: 4, borderLeftColor: colors.violet }]}
            onPress={() => {
              if (item.type === "checkup_ready") router.push("/coach");
              else if (item.params.application_id) router.push(`/application/${item.params.application_id}`);
            }}
          >
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={[styles.cardTitle, { fontSize: 16, flex: 1 }]}>{n.title}</Text>
              <Text style={styles.muted}>{formatDate(item.created_at, { day: "numeric", month: "short" })}</Text>
            </View>
            <Text>{n.body}</Text>
          </Pressable>
        );
      }}
    />
  );
}
