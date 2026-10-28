import { useCallback, useState } from "react";
import { Linking, RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { mobileFonts, palette as c, radius } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { formatDate } from "../../../src/lib/format";
import { Button, Chip, GUTTER, IconLine, Panel, Screen, Section, SkyHeader, Txt } from "../../../src/ui";
import { SuggestedListings } from "../../../src/ui/SuggestedListings";

type Item = { key: string; [k: string]: string | number | null };
type Report = {
  id: string; period_start: string; period_end: string; read_at: string | null;
  content: { stats: Record<string, number>; working: Item[]; blocking: Item[]; actions: Item[] };
};
const FREQUENCIES = [7, 14, 21, 30] as const;
const STATS = ["applications", "follow_ups", "invitations", "offers"] as const;

export default function Coach() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [frequency, setFrequency] = useState<number>(14);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: st }] = await Promise.all([
      supabase.from("checkup_reports").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("students").select("checkup_frequency_days").single(),
    ]);
    setReport(r as Report | null);
    if (st) setFrequency(st.checkup_frequency_days);
    if (r && !r.read_at) await supabase.from("checkup_reports").update({ read_at: new Date().toISOString() }).eq("id", r.id);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  async function requestNow() {
    setLoading(true);
    await supabase.rpc("request_checkup");
    await load();
  }

  async function changeFrequency(days: number) {
    if (!session) return;
    setFrequency(days);
    await supabase.from("students").update({ checkup_frequency_days: days }).eq("profile_id", session.user.id);
  }

  const itemText = (group: "workingItems" | "blockingItems" | "actionItems", i: Item) =>
    t(`coach.${group}.${i.key}`, {
      ...i,
      kind: i.appointment_kind ? t(`appointments.${i.appointment_kind}`).toLowerCase() : "",
      date: typeof i.starts_at === "string" ? formatDate(i.starts_at, { weekday: "long", day: "numeric", month: "long" }) : "",
    });

  const ct = report?.content;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.rhone} />}>
        <SkyHeader>
          <Txt variant="display" accessibilityRole="header">{t("coach.title")}</Txt>
          <Txt style={{ color: c.night }}>{t("coach.intro")}</Txt>
        </SkyHeader>

        <View style={{ paddingHorizontal: GUTTER }}>
          {!report ? (
            <Section title={t("coach.latest")} style={{ marginTop: 12 }}>
              <Txt>{t("coach.none")}</Txt>
              <Button title={t("coach.request")} icon="sparkles" onPress={() => void requestNow()} busy={loading} />
            </Section>
          ) : (
            <>
              <Section
                title={t("coach.latest")}
                caption={t("coach.period", { start: formatDate(report.period_start, { day: "numeric", month: "long" }), end: formatDate(report.period_end, { day: "numeric", month: "long" }) })}
                style={{ marginTop: 12 }}
              >
                <View accessibilityLabel={STATS.map((k) => t(`coach.stats.${k}`, { count: ct?.stats[k] ?? 0 })).join(", ")} accessible style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {STATS.map((k) => (
                    <View key={k} style={{ flexGrow: 1, flexBasis: "45%", backgroundColor: c.mist, borderRadius: radius.md, padding: 16, gap: 2 }}>
                      <Txt style={{ fontFamily: mobileFonts.black, fontSize: 32, lineHeight: 36, letterSpacing: -1, color: (ct?.stats[k] ?? 0) > 0 ? c.night : c.stone }}>
                        {ct?.stats[k] ?? 0}
                      </Txt>
                      <Txt variant="small">{t(`coach.statLabels.${k}`)}</Txt>
                    </View>
                  ))}
                </View>

                <Txt variant="subheading" style={{ marginTop: 12 }}>{t("coach.working")}</Txt>
                {ct?.working.length
                  ? ct.working.map((i, n) => <IconLine key={n} icon="checkmark-circle" color={c.vine}>{itemText("workingItems", i)}</IconLine>)
                  : <Txt variant="small">{t("coach.nothingWorkingYet")}</Txt>}

                <Txt variant="subheading" style={{ marginTop: 12 }}>{t("coach.blocking")}</Txt>
                {ct?.blocking.length
                  ? ct.blocking.map((i, n) => <IconLine key={n} icon="hourglass-outline" color={c.stone}>{itemText("blockingItems", i)}</IconLine>)
                  : <Txt variant="small">{t("coach.nothingBlocking")}</Txt>}
              </Section>

              {(ct?.actions.length ?? 0) > 0 && (
                <Section title={t("coach.actions")}>
                  {ct!.actions.map((i, n) => (
                    <View key={n} style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.apricot, alignItems: "center", justifyContent: "center" }}>
                        <Txt variant="smallStrong" style={{ fontFamily: mobileFonts.extraBold }}>{n + 1}</Txt>
                      </View>
                      <Txt style={{ flex: 1, paddingTop: 3 }}>{itemText("actionItems", i)}</Txt>
                    </View>
                  ))}
                </Section>
              )}
              <View style={{ marginTop: 20 }}>
                <Button variant="ghost" icon="refresh" title={t("coach.request")} onPress={() => void requestNow()} busy={loading} />
              </View>
            </>
          )}

          <SuggestedListings title={t("coach.suggestions")} />

          <Section title={t("coach.frequency")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {FREQUENCIES.map((d) => (
                <Chip key={d} label={t(`coach.frequencies.${d}`)} selected={frequency === d} onPress={() => void changeFrequency(d)} />
              ))}
            </View>
          </Section>

          <Panel tone="rhone" style={{ marginTop: 32, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="chatbubbles-outline" size={22} color={c.rhone} />
            <Txt variant="smallStrong" style={{ flex: 1, color: c.rhone }}>{t("coach.chatSoon")}</Txt>
          </Panel>

          <Section title={t("coach.helpTitle")}>
            <Txt>{t("coach.helpBody")}</Txt>
            <Button variant="dark" icon="call-outline" title={t("coach.helpCall")} onPress={() => void Linking.openURL("tel:147")} />
          </Section>
        </View>
      </ScrollView>
    </Screen>
  );
}
