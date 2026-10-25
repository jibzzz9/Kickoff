import { Pressable, ScrollView, Text } from "react-native";
import { useTranslation } from "react-i18next";
import type { ListingCard } from "../lib/types";
import { styles } from "./index";

/** Version navigateur (aperçu) : la carte native n'existe que sur téléphone ; on regroupe les places par commune. */
export function PlacesMap({ listings, onOpen }: { listings: ListingCard[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const byCommune = [...new Set(listings.map((l) => l.commune_name))].sort();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={styles.muted}>{t("places.mapWeb")}</Text>
      {byCommune.map((c) => (
        <Text key={c} style={styles.cardTitle}>
          📍 {c}{" "}
          {listings.filter((l) => l.commune_name === c).map((l) => (
            <Pressable key={l.id} onPress={() => onOpen(l.id!)}>
              <Text style={styles.link}>{l.title}  </Text>
            </Pressable>
          ))}
        </Text>
      ))}
    </ScrollView>
  );
}
