import { useCallback, useState } from "react";
import { Linking, Platform, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import * as Calendar from "expo-calendar";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { formatDate } from "../../../src/lib/format";
import { Button, Chip, Section, styles } from "../../../src/ui";
import { notify } from "../../../src/lib/confirm";

type Slot = { id: string; starts_at: string };
type Appt = {
  id: string; kind: "interview" | "trial"; status: string; location: string | null; contact_person: string | null;
  what_to_bring: string | null; duration_minutes: number; chosen_slot_id: string | null; application_id: string;
  appointment_slots: Slot[];
};

const when = (iso: string) => formatDate(iso, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function Appointments() {
  const { t } = useTranslation();
  const [items, setItems] = useState<(Appt & { company: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*, appointment_slots!appointment_slots_appointment_id_fkey(id, starts_at)")
      .order("created_at", { ascending: false });
    const appIds = [...new Set((data ?? []).map((a) => a.application_id))];
    const { data: apps } = appIds.length ? await supabase.from("applications").select("id, listing_id").in("id", appIds) : { data: [] };
    const listingIds = (apps ?? []).map((a) => a.listing_id);
    const { data: listings } = listingIds.length ? await supabase.from("listing_cards").select("id, company_name").in("id", listingIds) : { data: [] };
    const company = (appId: string) => listings?.find((l) => l.id === apps?.find((a) => a.id === appId)?.listing_id)?.company_name ?? "";
    setItems(((data ?? []) as Appt[]).map((a) => ({ ...a, company: company(a.application_id) })));
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  async function choose(a: Appt, slot: Slot) {
    setBusy(a.id);
    await supabase.rpc("student_choose_slot", { p_appointment: a.id, p_slot: slot.id });
    setBusy(null);
    await load();
  }

  async function addToCalendar(a: Appt & { company: string }, slot: Slot) {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return notify(t("appointments.calendarDenied"));
    const calendar = Platform.OS === "ios"
      ? await Calendar.getDefaultCalendarAsync()
      : (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find((c) => c.allowsModifications);
    if (!calendar) return;
    const start = new Date(slot.starts_at);
    await Calendar.createEventAsync(calendar.id, {
      title: t("appointments.eventTitle", { kind: t(`appointments.${a.kind}`), company: a.company }),
      startDate: start,
      endDate: new Date(start.getTime() + a.duration_minutes * 60000),
      location: a.location ?? undefined,
      notes: [a.contact_person && t("appointments.contact", { name: a.contact_person }), a.what_to_bring && t("appointments.bring", { items: a.what_to_bring })].filter(Boolean).join("\n"),
      alarms: [{ relativeOffset: -24 * 60 }, { relativeOffset: -60 }],
    });
    notify(t("appointments.addedToCalendar"));
  }

  const openDirections = (address: string) => {
    const q = encodeURIComponent(address);
    void Linking.openURL(Platform.OS === "ios" ? `http://maps.apple.com/?daddr=${q}&dirflg=r` : `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit`);
  };

  const now = Date.now();
  const chosenSlot = (a: Appt) => a.appointment_slots.find((s) => s.id === a.chosen_slot_id);
  const toChoose = items.filter((a) => a.status === "proposed");
  const upcoming = items.filter((a) => a.status === "scheduled" && new Date(chosenSlot(a)?.starts_at ?? 0).getTime() >= now);
  const past = items.filter((a) => !toChoose.includes(a) && !upcoming.includes(a));

  const card = (a: Appt & { company: string }) => {
    const slot = chosenSlot(a);
    return (
      <View key={a.id} style={[styles.card, { marginTop: spacing.sm }]}>
        <Text style={styles.badge}>{t(`appointments.${a.kind}`)}</Text>
        <Text style={styles.cardTitle}>{a.company}</Text>
        {a.status === "cancelled" && <Text style={styles.muted}>{t("appointments.cancelled")}</Text>}
        {slot && <Text style={{ fontWeight: "700" }}>{t("appointments.chosen", { date: when(slot.starts_at) })}</Text>}
        {a.location && <Text>{t("appointments.location", { location: a.location })}</Text>}
        {a.contact_person && <Text>{t("appointments.contact", { name: a.contact_person })}</Text>}
        {a.what_to_bring && <Text>{t("appointments.bring", { items: a.what_to_bring })}</Text>}
        {a.status === "proposed" && (
          <>
            <Text style={styles.label}>{t("appointments.chooseSlot")}</Text>
            <View style={styles.row}>
              {[...a.appointment_slots].sort((x, y) => x.starts_at.localeCompare(y.starts_at)).map((s) => (
                <Chip key={s.id} label={when(s.starts_at)} onPress={() => void choose(a, s)} />
              ))}
            </View>
            {busy === a.id && <Text style={styles.muted}>{t("common.loading")}</Text>}
          </>
        )}
        {a.status === "scheduled" && slot && (
          <View style={styles.row}>
            {a.location && <Button variant="ghost" title={t("appointments.directions")} onPress={() => openDirections(a.location!)} />}
            <Button variant="ghost" title={t("appointments.addToCalendar")} onPress={() => void addToCalendar(a, slot)} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.screen} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Text style={styles.title}>{t("appointments.title")}</Text>
        {items.length === 0 && !loading && <Text style={styles.muted}>{t("appointments.empty")}</Text>}
        {toChoose.length > 0 && <Section title={t("appointments.toChoose")}>{toChoose.map(card)}</Section>}
        {upcoming.length > 0 && <Section title={t("appointments.upcoming")}>{upcoming.map(card)}</Section>}
        {past.length > 0 && <Section title={t("appointments.past")}>{past.map(card)}</Section>}
      </ScrollView>
    </SafeAreaView>
  );
}
