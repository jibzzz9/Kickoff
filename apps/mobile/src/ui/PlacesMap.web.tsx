import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { palette as c } from "@kickoff/ui-tokens";
import type { ListingCard } from "../lib/types";
import { Panel, Txt } from "./index";

/** Version navigateur (aperçu) : la carte native n'existe que sur téléphone ; on regroupe les places par commune. */
export function PlacesMap({ listings, onOpen }: { listings: ListingCard[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const byCommune = [...new Set(listings.map((l) => l.commune_name))].sort();
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="small">{t("places.mapWeb")}</Txt>
      {byCommune.map((cm) => (
        <Panel key={cm} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="location" size={18} color={c.apricot} />
            <Txt variant="subheading">{cm}</Txt>
          </View>
          {listings.filter((l) => l.commune_name === cm).map((l) => (
            <Pressable key={l.id} accessibilityRole="link" onPress={() => onOpen(l.id!)} style={{ paddingVertical: 6 }}>
              <Txt variant="bodyStrong" style={{ color: c.rhone }}>{l.title}</Txt>
              <Txt variant="small">{l.company_name}</Txt>
            </Pressable>
          ))}
        </Panel>
      ))}
    </View>
  );
}
