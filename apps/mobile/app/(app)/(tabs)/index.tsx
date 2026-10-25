import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { formatDate, professionName } from "../../../src/lib/format";
import type { ListingCard } from "../../../src/lib/types";
import { Chip, styles } from "../../../src/ui";
import { PlacesMap } from "../../../src/ui/PlacesMap";
import { fetchCompat, type StudentMatch } from "../../../src/lib/match";
import { useUnreadCount } from "../../../src/lib/notifications";
import { useAuth } from "../../../src/auth/AuthProvider";
import { Ionicons } from "@expo/vector-icons";

export default function Places() {
  const { t } = useTranslation();
  const router = useRouter();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [compat, setCompat] = useState<Record<string, StudentMatch>>({});
  const { session } = useAuth();
  const unread = useUnreadCount(session?.user.id);
  const [consentPending, setConsentPending] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "map">("list");
  const [profession, setProfession] = useState<string | null>(null);
  const [commune, setCommune] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = [profession, commune, year].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("listing_cards").select("*").eq("status", "open").order("created_at", { ascending: false });
    setListings(data ?? []);
    setLoading(false);
    setCompat(await fetchCompat((data ?? []).map((l) => l.id!)));
    const { data: me } = await supabase.from("students").select("parental_consent").maybeSingle();
    setConsentPending(me?.parental_consent === "pending");
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
        <View style={[styles.row, { justifyContent: "space-between", flexWrap: "nowrap" }]}>
          <Text style={[styles.title, { marginBottom: 0, flex: 1 }]}>{t("places.title")}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("notifications.open", { count: unread.count })}
            onPress={() => router.push("/notifications")}
            style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="notifications" size={26} color={colors.ink} />
            {unread.count > 0 && (
              <View style={{ position: "absolute", top: 4, right: 2, backgroundColor: colors.coral, borderRadius: 10, minWidth: 20, paddingHorizontal: 4 }}>
                <Text style={{ color: colors.white, fontWeight: "800", fontSize: 12, textAlign: "center" }}>{unread.count}</Text>
              </View>
            )}
          </Pressable>
        </View>
        {consentPending && (
          <View style={[styles.notice, { gap: 8 }]}>
            <Text>{t("home.consentPending")}</Text>
            <Chip
              label={resent ? t("consentBanner.resent") : t("consentBanner.resend")}
              onPress={() => void supabase.functions.invoke("parent-consent", { body: { action: "send" } }).then(() => setResent(true))}
            />
          </View>
        )}
        <View style={styles.row}>
          <Chip label={t("places.list")} selected={mode === "list"} onPress={() => setMode("list")} />
          <Chip label={t("places.map")} selected={mode === "map"} onPress={() => setMode("map")} />
          <Chip
            label={activeFilters ? t("places.filtersActive", { count: activeFilters }) : t("places.filters")}
            selected={showFilters || activeFilters > 0}
            onPress={() => setShowFilters((v) => !v)}
          />
        </View>
        {showFilters && (
          <>
            {filterRow(t("places.profession"), options.professions, profession, setProfession)}
            {filterRow(t("places.commune"), options.communes, commune, setCommune)}
            {filterRow(t("places.startYear"), options.years.map((y) => ({ id: y, name: y })), year, setYear)}
          </>
        )}
      </View>

      {mode === "map" ? (
        <PlacesMap listings={filtered} onOpen={(id) => router.push(`/listing/${id}`)} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id!}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={loading ? undefined : <Text style={styles.muted}>{t("places.empty")}</Text>}
          renderItem={({ item: l }) => (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/listing/${l.id}`)} style={styles.card}>
              <View style={[styles.row, { justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }]}>
                <Text style={[styles.badge, { flexShrink: 1 }]} numberOfLines={1}>{professionName(l)}</Text>
                {compat[l.id!] && (
                  <Text accessibilityLabel={t("compat.ring", { score: compat[l.id!]!.score })} style={{ fontWeight: "800", color: colors.violet }}>
                    {t("compat.short", { score: compat[l.id!]!.score })}
                  </Text>
                )}
              </View>
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
