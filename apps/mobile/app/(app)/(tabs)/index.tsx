import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { palette as c } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { professionName } from "../../../src/lib/format";
import type { ListingCard } from "../../../src/lib/types";
import { Chip, Divider, GUTTER, IconButton, Screen, Segmented, SkyHeader, Txt } from "../../../src/ui";
import { ListingRow } from "../../../src/ui/ListingRow";
import { PlacesMap } from "../../../src/ui/PlacesMap";
import { fetchCompat, type StudentMatch } from "../../../src/lib/match";
import { useUnreadCount } from "../../../src/lib/notifications";
import { useAuth } from "../../../src/auth/AuthProvider";

export default function Places() {
  const { t } = useTranslation();
  const router = useRouter();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [compat, setCompat] = useState<Record<string, StudentMatch>>({});
  const [firstName, setFirstName] = useState("");
  const { session } = useAuth();
  const unread = useUnreadCount(session?.user.id);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "map">("list");
  const [profession, setProfession] = useState<string | null>(null);
  const [commune, setCommune] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = [profession, commune, year].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: me }] = await Promise.all([
      supabase.from("listing_cards").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("students").select("first_name").maybeSingle(),
    ]);
    setListings(data ?? []);
    setFirstName(me?.first_name ?? "");
    setLoading(false);
    setCompat(await fetchCompat((data ?? []).map((l) => l.id!)));
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
    <View style={{ gap: 8 }}>
      <Txt variant="smallStrong" style={{ paddingHorizontal: GUTTER }}>{label}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
        <Chip label={t("places.all")} selected={!value} onPress={() => set(null)} />
        {items.map((i) => (
          <Chip key={i.id} label={i.name} selected={value === i.id} onPress={() => set(value === i.id ? null : i.id)} />
        ))}
      </ScrollView>
    </View>
  );

  const header = (
    <>
      <SkyHeader
        right={
          <IconButton
            icon="notifications-outline"
            label={t("notifications.open", { count: unread.count })}
            badge={unread.count}
            onPress={() => router.push("/notifications")}
          />
        }
      >
        {firstName ? <Txt variant="bodyStrong" style={{ color: c.rhone }}>{t("home.welcome", { name: firstName })}</Txt> : null}
        <Txt variant="display" accessibilityRole="header">{t("places.title")}</Txt>
        {listings.length > 0 && <Txt variant="small" style={{ color: c.night }}>{t("places.count", { count: listings.length })}</Txt>}
      </SkyHeader>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: GUTTER, paddingTop: 8 }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "list", label: t("places.list"), icon: "list" },
            { value: "map", label: t("places.map"), icon: "map-outline" },
          ]}
        />
        <Chip
          icon="options-outline"
          label={activeFilters ? t("places.filtersActive", { count: activeFilters }) : t("places.filters")}
          selected={showFilters || activeFilters > 0}
          onPress={() => setShowFilters((v) => !v)}
        />
      </View>

      {showFilters && (
        <View style={{ gap: 16, paddingTop: 20 }}>
          {filterRow(t("places.profession"), options.professions, profession, setProfession)}
          {filterRow(t("places.commune"), options.communes, commune, setCommune)}
          {filterRow(t("places.startYear"), options.years.map((y) => ({ id: y, name: y })), year, setYear)}
        </View>
      )}
      <View style={{ height: 12 }} />
    </>
  );

  return (
    <Screen>
      {mode === "map" ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
          {header}
          <View style={{ flex: 1, paddingHorizontal: GUTTER }}>
            <PlacesMap listings={filtered} onOpen={(id) => router.push(`/listing/${id}`)} />
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id!}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.rhone} />}
          ItemSeparatorComponent={() => <Divider inset={GUTTER} />}
          ListEmptyComponent={loading ? undefined : <Txt variant="small" style={{ paddingHorizontal: GUTTER, paddingTop: 12 }}>{t("places.empty")}</Txt>}
          renderItem={({ item: l }) => <ListingRow listing={l} match={compat[l.id!]} onPress={() => router.push(`/listing/${l.id}`)} />}
        />
      )}
    </Screen>
  );
}
