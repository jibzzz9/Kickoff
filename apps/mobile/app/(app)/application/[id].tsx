import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { mobileFonts, palette as c, radius } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { formatDate } from "../../../src/lib/format";
import { Button, Divider, GUTTER, IconButton, IconLine, Monogram, Panel, Pill, Section, statusTone, Txt, type IconName } from "../../../src/ui";
import { confirmAsync, notify } from "../../../src/lib/confirm";
import { SuggestedListings } from "../../../src/ui/SuggestedListings";
import { Ridges } from "../../../src/ui/Ridge";
import { Trail } from "../../../src/ui/Trail";

type Message = { id: string; sender_role: string; kind: string; body: string | null; created_at: string; appointment_id: string | null };
type Evaluation = { appointment_id: string; punctuality: number; interest: number; team_contact: number; comment: string | null };
type State = {
  status: string; listingId: string; title: string; company: string; createdAt: string;
  messages: Message[]; kinds: Record<string, string>; evaluations: Evaluation[];
};

const EVENT_ICON: Record<string, IconName> = {
  invitation: "calendar", slot_chosen: "checkmark", offer: "trophy", offer_accepted: "trophy", offer_declined: "close",
  not_this_time: "mail", waitlist: "hourglass", filled: "flag", follow_up: "arrow-redo", withdrawn: "exit", trial_feedback: "chatbox-ellipses",
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
    if (error) notify(t("common.error"));
    await load();
  };

  async function send() {
    if (!session || !body.trim()) return;
    await run(() => supabase.from("messages").insert({ application_id: id, sender_role: "student", sender_id: session.user.id, body: body.trim() }));
    setBody("");
  }

  const confirm = async (text: string, action: () => void) => {
    if (await confirmAsync(text, undefined, { cancel: t("common.cancel"), ok: "OK" })) action();
  };

  if (!s) return <ActivityIndicator style={{ marginTop: 48 }} color={c.rhone} />;
  const kindLabel = (m: Message) => (m.appointment_id ? t(`appointments.${s.kinds[m.appointment_id] ?? "interview"}`).toLowerCase() : "");
  // Le texte des étapes du contrat est une liste « 1. … » : on l'affiche comme un vrai parcours numéroté.
  const contractSteps = t("application.contractSteps").split("\n").map((line) => line.replace(/^\d+\.\s*/, ""));

  return (
    <ScrollView style={{ backgroundColor: c.snow }} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: "" }} />
      <View style={{ backgroundColor: c.sky }}>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 14, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Monogram name={s.company} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="title" accessibilityRole="header">{s.company}</Txt>
              <Txt variant="small" style={{ color: c.night }}>{s.title}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Pill label={t(`status.${s.status}`)} tone={statusTone(s.status) === "mist" ? "night" : statusTone(s.status)} />
            <Txt variant="micro" style={{ color: c.night }}>{t("applications.sentOn", { date: formatDate(s.createdAt) })}</Txt>
          </View>
          <Trail status={s.status} />
        </View>
        <Ridges />
      </View>

      <View style={{ paddingHorizontal: GUTTER }}>
        {s.status === "offer" && (
          <Panel tone="apricot" style={{ marginTop: 16 }}>
            <Txt variant="heading">{t("application.offerTitle")}</Txt>
            <Button variant="dark" icon="checkmark" title={t("application.accept")} busy={busy}
              onPress={() => void run(() => supabase.rpc("student_respond_offer", { p_application: id, p_accept: true }))} />
            <Button variant="ghost" title={t("application.decline")} disabled={busy}
              onPress={() => confirm(t("application.declineConfirm"), () => void run(() => supabase.rpc("student_respond_offer", { p_application: id, p_accept: false })))} />
          </Panel>
        )}

        {s.status === "accepted" && (
          <Section title={t("application.contractTitle")}>
            {contractSteps.map((step, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i === 0 ? c.vine : c.rhoneSoft, alignItems: "center", justifyContent: "center" }}>
                  {i === 0 ? <Ionicons name="checkmark" size={16} color={c.snow} /> : <Txt variant="smallStrong" style={{ color: c.rhone }}>{i + 1}</Txt>}
                </View>
                <Txt style={{ flex: 1, paddingTop: 2 }}>{step}</Txt>
              </View>
            ))}
            <Panel>
              <IconLine icon="folder-open-outline" color={c.rhone} strong>{t("application.contractDocs")}</IconLine>
            </Panel>
            <Txt variant="micro">{t("application.contractNote")}</Txt>
          </Section>
        )}

        {s.evaluations.map((e) => (
          <Section key={e.appointment_id} title={t("application.feedbackTitle")}>
            {(["punctuality", "interest", "team_contact"] as const).map((k) => (
              <View key={k} style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Txt variant="smallStrong">{t(`application.${k === "team_contact" ? "team" : k}`)}</Txt>
                  <Txt variant="small">{t(`application.scale.${e[k]}`)}</Txt>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {[1, 2, 3, 4].map((n) => (
                    <View key={n} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: n <= e[k] ? c.rhone : c.mist }} />
                  ))}
                </View>
              </View>
            ))}
            {e.comment && (
              <Panel>
                <Txt style={{ fontFamily: mobileFonts.medium }}>« {e.comment} »</Txt>
              </Panel>
            )}
          </Section>
        ))}

        <Section title={t("application.thread")}>
          {s.messages.length === 0 && <Txt variant="small">{t("thread.empty")}</Txt>}
          {s.messages.map((m) => {
            const mine = m.sender_role === "student";
            return (
              <View key={m.id} style={{ alignItems: mine ? "flex-end" : "flex-start", gap: 6 }}>
                {m.kind !== "text" && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "stretch" }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.rhoneSoft, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={EVENT_ICON[m.kind] ?? "ellipse"} size={15} color={c.rhone} />
                    </View>
                    <Txt variant="smallStrong" style={{ flex: 1 }}>{t(`thread.events.${m.kind}`, { company: s.company, kind: kindLabel(m) })}</Txt>
                  </View>
                )}
                {m.body && (
                  <View
                    style={{
                      maxWidth: "88%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20,
                      backgroundColor: mine ? c.night : c.mist,
                      borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6,
                    }}
                  >
                    <Txt style={{ color: mine ? c.snow : c.night }}>{m.body}</Txt>
                  </View>
                )}
                <Txt variant="micro">{formatDate(m.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Txt>
              </View>
            );
          })}
          {canWrite(s.status) && (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 8 }}>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder={t("application.placeholder")}
                placeholderTextColor="#8C9AA2"
                accessibilityLabel={t("application.placeholder")}
                multiline
                maxLength={5000}
                style={{
                  flex: 1, minWidth: 0, minHeight: 48, maxHeight: 140, borderRadius: radius.lg, backgroundColor: c.mist,
                  paddingHorizontal: 18, paddingTop: 13, paddingBottom: 13, fontFamily: mobileFonts.regular, fontSize: 16, color: c.night,
                }}
              />
              <IconButton icon="arrow-up" tone="apricot" label={t("application.send")} onPress={() => void send()} disabled={!body.trim() || busy} />
            </View>
          )}
        </Section>

        {(s.status === "not_this_time" || s.status === "declined") && <SuggestedListings title={t("coach.alternatives")} />}

        <View style={{ marginTop: 32, gap: 4 }}>
          <Divider />
          <Button variant="quiet" icon="document-text-outline" title={t("application.viewListing")} onPress={() => router.push(`/listing/${s.listingId}`)} />
          {s.status === "sent" && (
            <Button variant="quiet" icon="arrow-redo-outline" title={t("application.followUp")} busy={busy}
              onPress={() => void run(() => supabase.rpc("student_follow_up", { p_application: id, p_message: t("application.followUpMessage") }))} />
          )}
          {!["accepted", "declined", "withdrawn", "not_this_time"].includes(s.status) && (
            <Button variant="danger" icon="exit-outline" title={t("application.withdraw")} disabled={busy}
              onPress={() => confirm(t("application.withdrawConfirm"), () => void run(() => supabase.rpc("student_withdraw", { p_application: id })))} />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// On peut toujours écrire à l'entreprise, sauf après avoir retiré sa candidature.
const canWrite = (status: string) => status !== "withdrawn";
