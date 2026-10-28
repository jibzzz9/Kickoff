import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { palette as c } from "@kickoff/ui-tokens";
import { formatDate, professionName } from "../lib/format";
import type { ListingCard } from "../lib/types";
import type { StudentMatch } from "../lib/match";
import { GUTTER, Meta, Txt, type IconName } from "./index";
import { RidgeMini } from "./Ridge";

/** Une place d'apprentissage dans une liste : métier, titre, entreprise, puis l'altitude de compatibilité à droite. */
export function ListingRow({ listing: l, match, onPress, extra }: { listing: ListingCard; match?: StudentMatch; onPress: () => void; extra?: { icon: IconName; label: string } }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: "row", gap: 16, paddingHorizontal: GUTTER, paddingVertical: 18, backgroundColor: pressed ? c.mist : c.snow })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="micro" style={{ color: c.rhone }} numberOfLines={1}>{professionName(l)}</Txt>
        <Txt variant="subheading" numberOfLines={2}>{l.title}</Txt>
        <Txt variant="small" numberOfLines={1}>{l.company_name}, {l.commune_name}</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4, marginTop: 6 }}>
          <Meta icon="calendar-clear-outline" label={t("places.startShort", { date: formatDate(l.start_date!, { month: "long", year: "numeric" }) })} />
          <Meta icon="people-outline" label={t("places.places", { count: l.places_count ?? 1 })} />
          {extra && <Meta icon={extra.icon} label={extra.label} />}
        </View>
      </View>
      {match && <RidgeMini score={match.score} text={t("compat.short", { score: match.score })} label={t("compat.ring", { score: match.score })} />}
    </Pressable>
  );
}
