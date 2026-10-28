import { useCallback, useState } from "react";
import { Linking, Platform, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Calendar from "expo-calendar";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { mobileFonts, palette as c, radius } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { formatDate } from "../../../src/lib/format";
import { Button, GUTTER, IconLine, Panel, Pill, Screen, Section, SkyHeader, Txt } from "../../../src/ui";
import { notify } from "../../../src/lib/confirm";

type Slot = { id: string; starts_at: string };
type Appt = {
  id: string; kind: "interview" | "trial"; status: string; location: string | null; contact_person: string | null;
  what_to_bring: string | null; duration_minutes: number; chosen_slot_id: string | null; application_id: string;
  appointment_slots: Slot[];
};

const when = (iso: string) => formatDate(iso, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** Bloc date façon éphéméride : jour en grand, mois et heure dessous. */
function DateBlock({ iso, dark }: { iso: string; dark?: boolean }) {
  const fg = dark ? c.snow : c.night;
  return (
    <View style={{ width: 64, paddingVertical: 10, borderRadius: radius.md, backgroundColor: dark ? c.night : c.snow, borderWidth: dark ? 0 : 1.5, borderColor: c.line, alignItems: "center", gap: 1 }}>
      <Txt variant="micro" style={{ color: dark ? c.skyDeep : c.stone }}>{formatDate(iso, { weekday: "short" })}</Txt>
      <Txt style={{ fontFamily: mobileFonts.black, fontSize: 26, lineHeight: 29, color: fg }}>{formatDate(iso, { day: "numeric" })}</Txt>
      <Txt variant="micro" style={{ color: fg }}>{formatDate(iso, { month: "short" })}</Txt>
    </View>
  );
}

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
      : (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find((cal) => cal.allowsModifications);
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

  const details = (a: Appt) => (
    <View style={{ gap: 8 }}>
      {a.location && <IconLine icon="location-outline" color={c.rhone}>{a.location}</IconLine>}
      {a.contact_person && <IconLine icon="person-outline" color={c.rhone}>{t("appointments.contact", { name: a.contact_person })}</IconLine>}
      {a.what_to_bring && <IconLine icon="bag-handle-outline" color={c.rhone}>{t("appointments.bring", { items: a.what_to_bring })}</IconLine>}
      <IconLine icon="time-outline" color={c.rhone}>{t("appointments.duration", { minutes: a.duration_minutes })}</IconLine>
    </View>
  );

  const heading = (a: Appt & { company: string }) => (
    <View style={{ gap: 6 }}>
      <Pill label={t(`appointments.${a.kind}`)} tone={a.kind === "trial" ? "vine" : "rhone"} />
      <Txt variant="heading">{a.company}</Txt>
    </View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.rhone} />}>
        <SkyHeader>
          <Txt variant="display" accessibilityRole="header">{t("appointments.title")}</Txt>
        </SkyHeader>
        <View style={{ paddingHorizontal: GUTTER }}>
          {items.length === 0 && !loading && <Txt variant="small" style={{ marginTop: 8 }}>{t("appointments.empty")}</Txt>}

          {toChoose.length > 0 && (
            <Section title={t("appointments.toChoose")} style={{ marginTop: 12 }}>
              {toChoose.map((a) => (
                <Panel key={a.id} tone="apricot">
                  {heading(a)}
                  {details(a)}
                  <Txt variant="smallStrong" style={{ marginTop: 6 }}>{t("appointments.chooseSlot")}</Txt>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {[...a.appointment_slots].sort((x, y) => x.starts_at.localeCompare(y.starts_at)).map((s) => (
                      <Pressable
                        key={s.id}
                        accessibilityRole="button"
                        accessibilityLabel={when(s.starts_at)}
                        disabled={busy === a.id}
                        onPress={() => void choose(a, s)}
                        style={({ pressed }) => ({
                          flexDirection: "row", alignItems: "center", gap: 12, padding: 8, paddingRight: 16, borderRadius: radius.md,
                          backgroundColor: c.snow, borderWidth: 2, borderColor: pressed ? c.night : c.snow, flexGrow: 1, minWidth: 140,
                        })}
                      >
                        <DateBlock iso={s.starts_at} dark />
                        <Txt variant="title" style={{ flex: 1 }}>{formatDate(s.starts_at, { hour: "2-digit", minute: "2-digit" })}</Txt>
                        <Ionicons name="radio-button-off" size={24} color={c.stone} />
                      </Pressable>
                    ))}
                  </View>
                  {busy === a.id && <Txt variant="small">{t("common.loading")}</Txt>}
                </Panel>
              ))}
            </Section>
          )}

          {upcoming.length > 0 && (
            <Section title={t("appointments.upcoming")}>
              {upcoming.map((a) => {
                const slot = chosenSlot(a)!;
                return (
                  <Panel key={a.id}>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <DateBlock iso={slot.starts_at} dark />
                      <View style={{ flex: 1, gap: 4 }}>
                        {heading(a)}
                        <Txt variant="bodyStrong">{t("appointments.chosen", { date: when(slot.starts_at) })}</Txt>
                      </View>
                    </View>
                    {details(a)}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                      {a.location && <Button compact variant="ghost" icon="navigate-outline" title={t("appointments.directions")} onPress={() => openDirections(a.location!)} />}
                      <Button compact variant="ghost" icon="calendar-outline" title={t("appointments.addToCalendar")} onPress={() => void addToCalendar(a, slot)} />
                    </View>
                  </Panel>
                );
              })}
            </Section>
          )}

          {past.length > 0 && (
            <Section title={t("appointments.past")}>
              {past.map((a) => {
                const slot = chosenSlot(a);
                return (
                  <View key={a.id} style={{ flexDirection: "row", gap: 14, alignItems: "center", opacity: 0.75 }}>
                    {slot ? <DateBlock iso={slot.starts_at} /> : <View style={{ width: 64 }} />}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="subheading">{a.company}</Txt>
                      <Txt variant="small">{t(`appointments.${a.kind}`)}{a.status === "cancelled" ? `, ${t("appointments.cancelled").toLowerCase()}` : ""}</Txt>
                    </View>
                  </View>
                );
              })}
            </Section>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
