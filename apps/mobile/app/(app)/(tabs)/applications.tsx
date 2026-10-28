import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { palette as c } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { formatDate } from "../../../src/lib/format";
import type { ListingCard } from "../../../src/lib/types";
import { Divider, GUTTER, Monogram, Pill, Screen, SkyHeader, statusTone, Txt } from "../../../src/ui";

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
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.rhone} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <SkyHeader>
              <Txt variant="display" accessibilityRole="header">{t("applications.title")}</Txt>
            </SkyHeader>
          </View>
        }
        ItemSeparatorComponent={() => <Divider inset={GUTTER + 60} />}
        ListEmptyComponent={loading ? undefined : <Txt variant="small" style={{ paddingHorizontal: GUTTER }}>{t("applications.empty")}</Txt>}
        renderItem={({ item: r }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/application/${r.id}`)}
            style={({ pressed }) => ({ flexDirection: "row", gap: 16, alignItems: "center", paddingHorizontal: GUTTER, paddingVertical: 16, backgroundColor: pressed ? c.mist : c.snow })}
          >
            <Monogram name={r.listing?.company_name ?? ""} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="subheading" numberOfLines={1}>{r.listing?.company_name}</Txt>
              <Txt variant="small" numberOfLines={1}>{r.listing?.title}</Txt>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <Pill label={t(`status.${r.status}`)} tone={statusTone(r.status)} />
                <Txt variant="micro">{t("applications.sentOn", { date: formatDate(r.created_at, { day: "numeric", month: "short" }) })}</Txt>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.stone} />
          </Pressable>
        )}
      />
    </Screen>
  );
}
