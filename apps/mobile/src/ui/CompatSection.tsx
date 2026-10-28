import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { mobileFonts, palette as c } from "@kickoff/ui-tokens";
import type { StudentMatch } from "../lib/match";
import { Divider, IconLine, Panel, Section, Txt } from "./index";
import { RidgeGauge } from "./Ridge";

// Critère rempli -> atout qui le décrit déjà (évite les doublons dans « Ce qui correspond »).
const STRENGTH_FOR_CRITERION: Record<string, string[]> = {
  trial_done: ["trials_in_profession"],
  min_average: ["good_average"],
  aptitude_test: ["test_result", "test_done"],
  languages: ["languages_match"],
  moped_license: ["moped_license"],
  volunteering: ["volunteering"],
};

/** Altitude de compatibilité + ce qui correspond + comment monter plus haut (avec le gain de chaque action). */
export function CompatSection({ match, criterionLabel }: { match: StudentMatch; criterionLabel: (key: string, kind: string) => string }) {
  const { t } = useTranslation();
  const lang = (codes: unknown) =>
    String(codes ?? "").split(",").filter(Boolean).map((l) => t(`languages.${l}`)).join(", ");

  const shownStrengths = new Set(match.strengths.map((s) => s.key as string));
  const matches = [
    ...match.strengths.map((s) => t(`compat.strengths.${s.key}`, { ...s.params, count: Number(s.params?.count ?? 1) })),
    ...match.criteria
      .filter((cr) => cr.status === "met" && !(STRENGTH_FOR_CRITERION[cr.key] ?? []).some((k) => shownStrengths.has(k)))
      .map((cr) => criterionLabel(cr.key, cr.kind)),
  ];

  return (
    <Section title={t("compat.title")}>
      <Panel>
        <RidgeGauge score={match.score} label={t("compat.ring", { score: match.score })} caption={t("compat.caption")} />
        {matches.length > 0 && (
          <>
            <Divider />
            <Txt variant="smallStrong">{t("compat.matches")}</Txt>
            {matches.slice(0, 4).map((m, i) => (
              <IconLine key={i} icon="checkmark-circle" color={c.vine}>{m}</IconLine>
            ))}
          </>
        )}
      </Panel>

      <View style={{ gap: 4, marginTop: 8 }}>
        <Txt variant="subheading">{t("compat.missing")}</Txt>
        {match.improvements.length === 0 && <Txt variant="small">{t("compat.nothingMissing")}</Txt>}
      </View>
      {match.improvements.map((i) => (
        <View key={i.action} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
          <Ionicons name="trending-up" size={20} color={c.rhone} />
          <Txt style={{ flex: 1 }}>{t(`compat.actions.${i.action}`, { ...i.params, languages: lang(i.params?.languages) })}</Txt>
          {i.projectedScore !== null && i.projectedScore > match.score && (
            <View
              accessible
              accessibilityLabel={t("compat.projected", { score: i.projectedScore })}
              style={{ backgroundColor: c.apricotSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}
            >
              <Txt variant="smallStrong" style={{ fontFamily: mobileFonts.extraBold }}>+{i.projectedScore - match.score}</Txt>
            </View>
          )}
        </View>
      ))}
      <Txt variant="micro" style={{ marginTop: 4 }}>{t("compat.notice")}</Txt>
    </Section>
  );
}
