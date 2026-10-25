import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { StudentMatch } from "../lib/match";
import { Section, styles } from "./index";
import { Ring } from "./Ring";

/** Anneau + ce qui correspond + ce qu'il manque (avec le score projeté de chaque action). */
// Critère rempli -> atout qui le décrit déjà (évite les doublons dans « Ce qui correspond »).
const STRENGTH_FOR_CRITERION: Record<string, string[]> = {
  trial_done: ["trials_in_profession"],
  min_average: ["good_average"],
  aptitude_test: ["test_result", "test_done"],
  languages: ["languages_match"],
  moped_license: ["moped_license"],
  volunteering: ["volunteering"],
};

/** Anneau + ce qui correspond + ce qu'il manque (avec le score projeté de chaque action). */
export function CompatSection({ match, criterionLabel }: { match: StudentMatch; criterionLabel: (key: string, kind: string) => string }) {
  const { t } = useTranslation();
  const lang = (codes: unknown) =>
    String(codes ?? "").split(",").filter(Boolean).map((l) => t(`languages.${l}`)).join(", ");

  const shownStrengths = new Set(match.strengths.map((s) => s.key as string));
  const matches = [
    ...match.strengths.map((s) => t(`compat.strengths.${s.key}`, { ...s.params, count: Number(s.params?.count ?? 1) })),
    ...match.criteria
      .filter((c) => c.status === "met" && !(STRENGTH_FOR_CRITERION[c.key] ?? []).some((k) => shownStrengths.has(k)))
      .map((c) => t("compat.criterionMet", { label: criterionLabel(c.key, c.kind) })),
  ];

  return (
    <Section title={t("compat.title")}>
      <View style={[styles.row, { gap: 16, flexWrap: "nowrap" }]}>
        <Ring score={match.score} label={t("compat.ring", { score: match.score })} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontWeight: "800" }}>{t("compat.matches")}</Text>
          {matches.slice(0, 4).map((m, i) => (
            <Text key={i}>• {m}</Text>
          ))}
        </View>
      </View>
      <Text style={[styles.label, { fontSize: 16 }]}>{t("compat.missing")}</Text>
      {match.improvements.length === 0 ? (
        <Text>{t("compat.nothingMissing")}</Text>
      ) : (
        match.improvements.map((i) => (
          <View key={i.action} style={[styles.row, { justifyContent: "space-between", flexWrap: "nowrap" }]}>
            <Text style={{ flex: 1 }}>→ {t(`compat.actions.${i.action}`, { ...i.params, languages: lang(i.params?.languages) })}</Text>
            {i.projectedScore !== null && <Text style={styles.badge}>{t("compat.projected", { score: i.projectedScore })}</Text>}
          </View>
        ))
      )}
      <Text style={[styles.muted, { fontSize: 13 }]}>{t("compat.notice")}</Text>
    </Section>
  );
}
