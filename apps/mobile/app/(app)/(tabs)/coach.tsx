import { useCallback, useState } from "react";
import { Linking, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { formatDate } from "../../../src/lib/format";
import { Button, Chip, Section, styles } from "../../../src/ui";
import { SuggestedListings } from "../../../src/ui/SuggestedListings";

type Item = { key: string; [k: string]: string | number | null };
type Report = {
  id: string; period_start: string; period_end: string; read_at: string | null;
  content: { stats: Record<string, number>; working: Item[]; blocking: Item[]; actions: Item[] };
};
const FREQUENCIES = [7, 14, 21, 30] as const;

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

  const c = report?.content;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.screen} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Text style={[styles.title, { marginBottom: 0 }]}>{t("coach.title")}</Text>
        <Text style={styles.muted}>{t("coach.intro")}</Text>

        {!report ? (
          <Section title={t("coach.latest")}>
            <Text>{t("coach.none")}</Text>
            <Button title={t("coach.request")} onPress={() => void requestNow()} busy={loading} />
          </Section>
        ) : (
          <>
            <Section title={t("coach.latest")}>
              <Text style={styles.muted}>{t("coach.period", { start: formatDate(report.period_start), end: formatDate(report.period_end) })}</Text>
              <Text style={styles.label}>{t("coach.done")}</Text>
              {(["applications", "follow_ups", "invitations", "offers"] as const).map((k) => (
                <Text key={k}>• {t(`coach.stats.${k}`, { count: c?.stats[k] ?? 0 })}</Text>
              ))}
              <Text style={styles.label}>{t("coach.working")}</Text>
              {c?.working.length ? c.working.map((i, n) => <Text key={n}>✓ {itemText("workingItems", i)}</Text>) : <Text>{t("coach.nothingWorkingYet")}</Text>}
              <Text style={styles.label}>{t("coach.blocking")}</Text>
              {c?.blocking.length ? c.blocking.map((i, n) => <Text key={n}>• {itemText("blockingItems", i)}</Text>) : <Text>{t("coach.nothingBlocking")}</Text>}
            </Section>
            {(c?.actions.length ?? 0) > 0 && (
              <Section title={t("coach.actions")}>
                {c!.actions.map((i, n) => (
                  <View key={n} style={[styles.row, { flexWrap: "nowrap", alignItems: "flex-start" }]}>
                    <Text style={[styles.badge, { minWidth: 26, textAlign: "center" }]}>{n + 1}</Text>
                    <Text style={{ flex: 1 }}>{itemText("actionItems", i)}</Text>
                  </View>
                ))}
              </Section>
            )}
            <Button variant="ghost" title={t("coach.request")} onPress={() => void requestNow()} busy={loading} />
          </>
        )}

        <SuggestedListings title={t("coach.suggestions")} />

        <Section title={t("coach.frequency")}>
          <View style={styles.row}>
            {FREQUENCIES.map((d) => (
              <Chip key={d} label={t(`coach.frequencies.${d}`)} selected={frequency === d} onPress={() => void changeFrequency(d)} />
            ))}
          </View>
        </Section>

        <Text style={[styles.muted, { marginTop: 8 }]}>{t("coach.chatSoon")}</Text>

        <Section title={t("coach.helpTitle")}>
          <Text>{t("coach.helpBody")}</Text>
          <Button variant="ghost" title={t("coach.helpCall")} onPress={() => void Linking.openURL("tel:147")} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
