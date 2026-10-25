import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@kickoff/ui-tokens";
import { supabase } from "../lib/supabase";
import { fetchCompat, type StudentMatch } from "../lib/match";
import { professionName } from "../lib/format";
import type { ListingCard } from "../lib/types";
import { Section, styles } from "./index";

type Suggestion = { listing_id: string; reason: string; distance_km: number | null };

/** Places proposées par le coach (métiers visés, déjà tentés, puis proximité), avec la compatibilité. */
export function SuggestedListings({ title, limit = 3 }: { title: string; limit?: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<(Suggestion & { listing?: ListingCard; match?: StudentMatch })[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("suggest_listings", { p_limit: limit });
    const ids = (data ?? []).map((s) => s.listing_id);
    if (!ids.length) return setItems([]);
    const [{ data: listings }, compat] = await Promise.all([supabase.from("listing_cards").select("*").in("id", ids), fetchCompat(ids)]);
    setItems((data ?? []).map((s) => ({ ...s, listing: listings?.find((l) => l.id === s.listing_id), match: compat[s.listing_id] })));
  }, [limit]);
  useFocusEffect(useCallback(() => void load(), [load]));

  if (!items.length) return null;
  return (
    <Section title={title}>
      {items.map((s) =>
        s.listing ? (
          <Pressable key={s.listing_id} accessibilityRole="button" onPress={() => router.push(`/listing/${s.listing_id}`)}
            style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={styles.badge}>{t(`coach.reasons.${s.reason}`)}</Text>
              {s.match && <Text style={{ fontWeight: "800", color: colors.violet }}>{t("compat.ring", { score: s.match.score })}</Text>}
            </View>
            <Text style={styles.cardTitle}>{s.listing.title}</Text>
            <Text style={styles.muted}>
              {professionName(s.listing)} · {s.listing.company_name} · {s.listing.commune_name}
              {s.distance_km !== null ? ` · ${t("coach.distance", { km: s.distance_km })}` : ""}
            </Text>
          </Pressable>
        ) : null,
      )}
    </Section>
  );
}
