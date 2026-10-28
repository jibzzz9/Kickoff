import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { palette as c } from "@kickoff/ui-tokens";
import { Txt } from "./index";

const STEPS = ["sent", "meeting", "offer", "contract"] as const;
const STEP_OF: Record<string, number> = { sent: 0, followed_up: 0, interview: 1, trial: 1, waitlist: 1, offer: 2, accepted: 3 };

/** Le sentier d'une candidature : envoyée, rencontre, proposition, contrat. Masqué quand la candidature est close. */
export function Trail({ status }: { status: string }) {
  const { t } = useTranslation();
  const current = STEP_OF[status];
  if (current === undefined) return null;
  return (
    <View
      accessible
      accessibilityLabel={t("trail.label", { n: current + 1, total: STEPS.length, step: t(`trail.${STEPS[current]}`) })}
      style={{ flexDirection: "row", marginTop: 6 }}
    >
      {STEPS.map((k, i) => {
        const last = i === STEPS.length - 1;
        return (
          <View key={k} style={last ? { minWidth: 72 } : { flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", height: 18 }}>
              <View
                style={
                  i === current
                    ? { width: 18, height: 18, borderRadius: 9, backgroundColor: c.apricot, borderWidth: 3, borderColor: c.snow }
                    : { width: 10, height: 10, borderRadius: 5, marginHorizontal: 4, backgroundColor: i < current ? c.rhone : c.sky, borderWidth: 2, borderColor: i < current ? c.rhone : c.skyDeep }
                }
              />
              {!last && <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: i < current ? c.rhone : c.skyDeep }} />}
            </View>
            <Txt variant="micro" numberOfLines={1} style={{ marginTop: 6, color: i <= current ? c.night : c.stone }}>{t(`trail.${k}`)}</Txt>
          </View>
        );
      })}
    </View>
  );
}
