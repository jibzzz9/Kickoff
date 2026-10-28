import { useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { fetchCompat, type StudentMatch } from "../lib/match";
import type { ListingCard } from "../lib/types";
import { Divider, GUTTER, Section } from "./index";
import { ListingRow } from "./ListingRow";

type Suggestion = { listing_id: string; reason: string; distance_km: number | null };

const REASON_ICON = { target_profession: "heart-outline", same_profession: "repeat-outline", nearby: "location-outline" } as const;

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
      {/* Les lignes vont jusqu'aux bords de l'écran, comme dans l'onglet Places. */}
      <View style={{ marginHorizontal: -GUTTER }}>
        {items.map((s, i) =>
          s.listing ? (
            <View key={s.listing_id}>
              {i > 0 && <Divider inset={GUTTER} />}
              <ListingRow
                listing={s.listing}
                match={s.match}
                onPress={() => router.push(`/listing/${s.listing_id}`)}
                extra={{
                  icon: REASON_ICON[s.reason as keyof typeof REASON_ICON] ?? "sparkles-outline",
                  label: s.distance_km !== null && s.reason === "nearby" ? t("coach.distance", { km: s.distance_km }) : t(`coach.reasons.${s.reason}`),
                }}
              />
            </View>
          ) : null,
        )}
      </View>
    </Section>
  );
}
