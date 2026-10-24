import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { formatDate } from "../../src/lib/format";
import type { ListingCard } from "../../src/lib/types";
import { styles } from "../../src/ui";

type Row = { id: string; status: string; created_at: string; listing: ListingCard | undefined };

export default function Applications() {
  const { t } = useTranslation();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: apps } = await supabase.from("applications").select("id, status, created_at, listing_id").order("created_at", { ascending: false });
    const ids = (apps ?? []).map((a) => a.listing_id);
    const { data: listings } = ids.length
      ? await supabase.from("listing_cards").select("*").in("id", ids)
      : { data: [] as ListingCard[] };
    setRows((apps ?? []).map((a) => ({ ...a, listing: listings?.find((l) => l.id === a.listing_id) })));
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={<Text style={styles.title}>{t("applications.title")}</Text>}
        ListEmptyComponent={loading ? undefined : <Text style={styles.muted}>{t("applications.empty")}</Text>}
        renderItem={({ item: r }) => (
          <Pressable accessibilityRole="button" style={styles.card} onPress={() => r.listing && router.push(`/listing/${r.listing.id}`)}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={[styles.cardTitle, { flex: 1 }]}>{r.listing?.company_name}</Text>
              <Text style={styles.badge}>{t(`status.${r.status}`)}</Text>
            </View>
            <Text>{r.listing?.title}</Text>
            <Text style={styles.muted}>{t("applications.sentOn", { date: formatDate(r.created_at) })}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
