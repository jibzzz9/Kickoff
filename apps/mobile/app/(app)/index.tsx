import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { formatDate, professionName } from "../../src/lib/format";
import type { ListingCard } from "../../src/lib/types";
import { Chip, styles } from "../../src/ui";

const VALAIS = { latitude: 46.22, longitude: 7.5, latitudeDelta: 0.9, longitudeDelta: 1.3 };

export default function Places() {
  const { t } = useTranslation();
  const router = useRouter();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "map">("list");
  const [profession, setProfession] = useState<string | null>(null);
  const [commune, setCommune] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("listing_cards").select("*").eq("status", "open").order("created_at", { ascending: false });
    setListings(data ?? []);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  // Filtres calculés côté client (volume MVP : quelques dizaines d'annonces en Valais).
  const options = useMemo(() => {
    const uniq = <T,>(xs: T[]) => [...new Map(xs.map((x) => [JSON.stringify(x), x])).values()];
    return {
      professions: uniq(listings.map((l) => ({ id: l.profession_id!, name: professionName(l) }))),
      communes: uniq(listings.map((l) => ({ id: l.commune_id!, name: l.commune_name! }))).sort((a, b) => a.name.localeCompare(b.name)),
      years: uniq(listings.map((l) => l.start_date!.slice(0, 4))).sort(),
    };
  }, [listings]);

  const filtered = listings.filter(
    (l) => (!profession || l.profession_id === profession) && (!commune || l.commune_id === commune) && (!year || l.start_date?.startsWith(year)),
  );

  const filterRow = (label: string, items: { id: string; name: string }[], value: string | null, set: (v: string | null) => void) => (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip label={t("places.all")} selected={!value} onPress={() => set(null)} />
        {items.map((i) => (
          <Chip key={i.id} label={i.name} selected={value === i.id} onPress={() => set(value === i.id ? null : i.id)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
        <Text style={[styles.title, { marginBottom: 0 }]}>{t("places.title")}</Text>
        <View style={styles.row}>
          <Chip label={t("places.list")} selected={mode === "list"} onPress={() => setMode("list")} />
          <Chip label={t("places.map")} selected={mode === "map"} onPress={() => setMode("map")} />
        </View>
        {filterRow(t("places.profession"), options.professions, profession, setProfession)}
        {filterRow(t("places.commune"), options.communes, commune, setCommune)}
        {filterRow(t("places.startYear"), options.years.map((y) => ({ id: y, name: y })), year, setYear)}
      </View>

      {mode === "map" ? (
        <MapView style={{ flex: 1, marginTop: spacing.md }} initialRegion={VALAIS}>
          {filtered.map((l) => (
            <Marker
              key={l.id}
              coordinate={{ latitude: l.lat!, longitude: l.lng! }}
              title={l.title ?? ""}
              description={`${l.company_name} · ${l.commune_name}`}
              pinColor={colors.violet}
              onCalloutPress={() => router.push(`/listing/${l.id}`)}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id!}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={loading ? undefined : <Text style={styles.muted}>{t("places.empty")}</Text>}
          renderItem={({ item: l }) => (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/listing/${l.id}`)} style={styles.card}>
              <Text style={styles.badge}>{professionName(l)}</Text>
              <Text style={styles.cardTitle}>{l.title}</Text>
              <Text style={styles.muted}>{l.company_name} · {l.commune_name}</Text>
              <Text style={styles.muted}>
                {t("places.startDate", { date: formatDate(l.start_date!) })} · {t("places.places", { count: l.places_count ?? 1 })}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
