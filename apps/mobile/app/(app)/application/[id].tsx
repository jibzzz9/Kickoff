import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { formatDate } from "../../../src/lib/format";
import { Button, Section, styles } from "../../../src/ui";
import { SuggestedListings } from "../../../src/ui/SuggestedListings";

type Message = { id: string; sender_role: string; kind: string; body: string | null; created_at: string; appointment_id: string | null };
type Evaluation = { appointment_id: string; punctuality: number; interest: number; team_contact: number; comment: string | null };
type State = {
  status: string; listingId: string; title: string; company: string; createdAt: string;
  messages: Message[]; kinds: Record<string, string>; evaluations: Evaluation[];
};

export default function ApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const [s, setS] = useState<State | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: app } = await supabase.from("applications").select("id, status, listing_id, created_at").eq("id", id).maybeSingle();
    if (!app) return;
    const [{ data: listing }, { data: messages }, { data: appts }] = await Promise.all([
      supabase.from("listing_cards").select("title, company_name").eq("id", app.listing_id).maybeSingle(),
      supabase.from("messages").select("id, sender_role, kind, body, created_at, appointment_id").eq("application_id", id).order("created_at"),
      supabase.from("appointments").select("id, kind").eq("application_id", id),
    ]);
    // La RLS ne renvoie une évaluation que si l'entreprise l'a partagée et que le jeune a accepté les retours.
    const trialIds = (appts ?? []).filter((a) => a.kind === "trial").map((a) => a.id);
    const { data: evaluations } = trialIds.length
      ? await supabase.from("trial_evaluations").select("appointment_id, punctuality, interest, team_contact, comment").in("appointment_id", trialIds)
      : { data: [] };
    setS({
      status: app.status, listingId: app.listing_id, createdAt: app.created_at,
      title: listing?.title ?? "", company: listing?.company_name ?? "",
      messages: (messages ?? []) as Message[],
      kinds: Object.fromEntries((appts ?? []).map((a) => [a.id, a.kind])),
      evaluations: (evaluations ?? []) as Evaluation[],
    });
  }, [id]);
  useFocusEffect(useCallback(() => void load(), [load]));

  // Nouveaux messages de l'entreprise en direct.
  useEffect(() => {
    const channel = supabase
      .channel(`application-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${id}` }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, load]);

  const run = async (fn: () => PromiseLike<{ error: unknown }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) Alert.alert(t("common.error"));
    await load();
  };

  async function send() {
    if (!session || !body.trim()) return;
    await run(() => supabase.from("messages").insert({ application_id: id, sender_role: "student", sender_id: session.user.id, body: body.trim() }));
    setBody("");
  }

  const confirm = (text: string, action: () => void) =>
    Alert.alert(text, undefined, [{ text: t("common.cancel"), style: "cancel" }, { text: "OK", onPress: action }]);

  if (!s) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.violet} />;
  const kindLabel = (m: Message) => (m.appointment_id ? t(`appointments.${s.kinds[m.appointment_id] ?? "interview"}`).toLowerCase() : "");

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: s.company }} />
      <Text style={styles.badge}>{t(`status.${s.status}`)}</Text>
      <Text style={[styles.title, { marginBottom: 0 }]}>{s.company}</Text>
      <Text style={styles.muted}>{s.title}</Text>
      <Text style={styles.muted}>{t("applications.sentOn", { date: formatDate(s.createdAt) })}</Text>

      {s.status === "offer" && (
        <Section title={t("application.offerTitle")}>
          <Button title={t("application.accept")} busy={busy} onPress={() => void run(() => supabase.rpc("student_respond_offer", { p_application: id, p_accept: true }))} />
          <Button variant="ghost" title={t("application.decline")} disabled={busy}
            onPress={() => confirm(t("application.declineConfirm"), () => void run(() => supabase.rpc("student_respond_offer", { p_application: id, p_accept: false })))} />
        </Section>
      )}

      {s.status === "accepted" && (
        <Section title={t("application.contractTitle")}>
          <Text>{t("application.contractSteps")}</Text>
          <Text style={{ fontWeight: "700" }}>{t("application.contractDocs")}</Text>
          <Text style={[styles.muted, { fontSize: 13 }]}>{t("application.contractNote")}</Text>
        </Section>
      )}

      {s.evaluations.map((e) => (
        <Section key={e.appointment_id} title={t("application.feedbackTitle")}>
          {(["punctuality", "interest", "team_contact"] as const).map((k) => (
            <Text key={k}>
              {t(`application.${k === "team_contact" ? "team" : k}`)} : <Text style={{ fontWeight: "800" }}>{t(`application.scale.${e[k]}`)}</Text>
            </Text>
          ))}
          {e.comment && <Text style={{ fontStyle: "italic" }}>« {e.comment} »</Text>}
        </Section>
      ))}

      <Section title={t("application.thread")}>
        {s.messages.length === 0 && <Text style={styles.muted}>{t("thread.empty")}</Text>}
        {s.messages.map((m) => {
          const mine = m.sender_role === "student";
          return (
            <View key={m.id} style={{ alignItems: mine ? "flex-end" : "flex-start", gap: 2 }}>
              <Text style={[styles.muted, { fontSize: 12 }]}>{formatDate(m.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
              {m.kind !== "text" && <Text style={{ fontWeight: "800" }}>{t(`thread.events.${m.kind}`, { company: s.company, kind: kindLabel(m) })}</Text>}
              {m.body && (
                <Text style={{ backgroundColor: mine ? "#EFEBFF" : colors.surface, padding: spacing.sm, borderRadius: 12, maxWidth: "90%" }}>{m.body}</Text>
              )}
            </View>
          );
        })}
        {canWrite(s.status) && (
          <View style={[styles.row, { flexWrap: "nowrap" }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput value={body} onChangeText={setBody} placeholder={t("application.placeholder")} placeholderTextColor="#8A8FA3"
                accessibilityLabel={t("application.placeholder")} style={[styles.input, { width: "100%" }]} maxLength={5000} />
            </View>
            <Button compact title={t("application.send")} onPress={() => void send()} disabled={!body.trim() || busy} />
          </View>
        )}
      </Section>

      {(s.status === "not_this_time" || s.status === "declined") && <SuggestedListings title={t("coach.alternatives")} />}

      {s.status === "sent" && (
        <Button variant="ghost" title={t("application.followUp")} busy={busy}
          onPress={() => void run(() => supabase.rpc("student_follow_up", { p_application: id, p_message: t("application.followUpMessage") }))} />
      )}
      {!["accepted", "declined", "withdrawn", "not_this_time"].includes(s.status) && (
        <Button variant="ghost" title={t("application.withdraw")} disabled={busy}
          onPress={() => confirm(t("application.withdrawConfirm"), () => void run(() => supabase.rpc("student_withdraw", { p_application: id })))} />
      )}
      <Button variant="ghost" title={t("application.viewListing")} onPress={() => router.push(`/listing/${s.listingId}`)} />
    </ScrollView>
  );
}

// On peut toujours écrire à l'entreprise, sauf après avoir retiré sa candidature.
const canWrite = (status: string) => status !== "withdrawn";
