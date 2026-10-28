import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { applicationInputSchema } from "@kickoff/shared";
import { palette as c, radius } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { formatDate, professionName } from "../../../src/lib/format";
import type { ListingCard, ListingCriterion } from "../../../src/lib/types";
import { Button, Feedback, Field, GUTTER, IconLine, Monogram, Panel, Section, Txt, type IconName } from "../../../src/ui";
import { CompatSection } from "../../../src/ui/CompatSection";
import { Ridges } from "../../../src/ui/Ridge";
import { fetchCompat, type StudentMatch } from "../../../src/lib/match";

type State = {
  listing: ListingCard | null;
  criteria: ListingCriterion[];
  appliedAt: string | null;
  cv: { id: string; file_name: string } | null;
  match: StudentMatch | null;
  transit: { minutes: number | null; transfers?: number; sameCommune?: boolean } | null;
};

const CRITERION_ICON: Record<string, { icon: IconName; color: string }> = {
  met: { icon: "checkmark-circle", color: c.vine },
  not_met: { icon: "ellipse-outline", color: c.stone },
  unknown: { icon: "help-circle-outline", color: c.stone },
};

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [s, setS] = useState<State | null>(null);
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Vue comptée pour les statistiques de l'entreprise (une par jour).
    void supabase.rpc("record_listing_view", { p_listing: id });
    const [listing, criteria, application, cv, compat, transit] = await Promise.all([
      supabase.from("listing_cards").select("*").eq("id", id).maybeSingle(),
      supabase.from("listing_criteria").select("kind, key, value").eq("listing_id", id),
      supabase.from("applications").select("created_at").eq("listing_id", id).maybeSingle(),
      supabase.from("student_documents").select("id, file_name").eq("kind", "cv").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      fetchCompat([id]),
      supabase.functions.invoke<State["transit"]>("transit", { body: { listingId: id } }),
    ]);
    setS({
      listing: listing.data,
      criteria: criteria.data ?? [],
      appliedAt: application.data?.created_at ?? null,
      cv: cv.data,
      match: compat[id] ?? null,
      transit: transit.data ?? null,
    });
  }, [id]);
  useFocusEffect(useCallback(() => void load(), [load]));

  async function apply() {
    if (!session || !s?.listing) return;
    setError(null);
    const parsed = applicationInputSchema.safeParse({ listingId: id, coverLetter: letter || undefined, cvDocumentId: s.cv?.id });
    if (!parsed.success) return setError(t("common.error"));
    setBusy(true);
    const { error: err } = await supabase.from("applications").insert({
      student_id: session.user.id,
      listing_id: parsed.data.listingId,
      cover_letter: parsed.data.coverLetter ?? null,
      cv_document_id: parsed.data.cvDocumentId ?? null,
    });
    setBusy(false);
    if (err) return setError(t("common.error"));
    await load();
  }

  if (!s) return <ActivityIndicator style={{ marginTop: 48 }} color={c.rhone} />;
  const l = s.listing;
  if (!l) return <Txt variant="small" style={{ padding: GUTTER }}>{t("listing.notFound")}</Txt>;

  const criterionText = (cr: ListingCriterion) => {
    const value = cr.key === "languages" && Array.isArray(cr.value)
      ? cr.value.map((x) => t(`languages.${String(x)}`)).join(", ")
      : String(cr.value);
    return t(`criteria.${cr.key}`, { value });
  };
  const statusOf = (cr: ListingCriterion) => s.match?.criteria.find((m) => m.key === cr.key && m.kind === cr.kind)?.status ?? "unknown";

  return (
    <ScrollView style={{ backgroundColor: c.snow }} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: "" }} />
      <View style={{ backgroundColor: c.sky }}>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 10, gap: 10 }}>
          <Txt variant="bodyStrong" style={{ color: c.rhone }}>{professionName(l)}</Txt>
          <Txt variant="title" accessibilityRole="header">{l.title}</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
            <Monogram name={l.company_name ?? ""} size={40} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{l.company_name}</Txt>
              <Txt variant="small" style={{ color: c.night }}>{l.commune_name}</Txt>
            </View>
          </View>
        </View>
        <Ridges />
      </View>

      <View style={{ paddingHorizontal: GUTTER }}>
        <View style={{ gap: 12, paddingTop: 8 }}>
          {s.transit?.sameCommune ? (
            <IconLine icon="walk-outline" color={c.rhone}>{t("transit.sameCommune")}</IconLine>
          ) : s.transit?.minutes ? (
            <IconLine icon="train-outline" color={c.rhone}>
              {t("transit.minutes", { minutes: s.transit.minutes })}
              {s.transit.transfers ? `, ${t("transit.transfers", { count: s.transit.transfers })}` : ""}
            </IconLine>
          ) : null}
          <IconLine icon="calendar-clear-outline" color={c.rhone}>{t("places.startDate", { date: formatDate(l.start_date!) })}</IconLine>
          <IconLine icon="people-outline" color={c.rhone}>{t("places.places", { count: l.places_count ?? 1 })}</IconLine>
        </View>

        {s.match && (
          <CompatSection
            match={s.match}
            criterionLabel={(key, kind) => {
              const cr = s.criteria.find((x) => x.key === key && x.kind === kind);
              return cr ? criterionText(cr) : key;
            }}
          />
        )}

        <Section title={t("listing.about")}>
          <Txt>{l.description}</Txt>
          {l.contact_name ? <IconLine icon="person-circle-outline">{t("listing.contact", { name: l.contact_name })}</IconLine> : null}
        </Section>

        {s.criteria.length > 0 && (
          <Section title={t("listing.criteria")}>
            {(["required", "bonus"] as const).map((kind) => {
              const items = s.criteria.filter((cr) => cr.kind === kind);
              if (!items.length) return null;
              return (
                <View key={kind} style={{ gap: 10 }}>
                  <Txt variant="smallStrong" style={{ color: c.stone }}>{t(`listing.${kind}`)}</Txt>
                  {items.map((cr) => {
                    const st = CRITERION_ICON[statusOf(cr)] ?? CRITERION_ICON.unknown!;
                    return <IconLine key={cr.key} icon={st.icon} color={st.color}>{criterionText(cr)}</IconLine>;
                  })}
                </View>
              );
            })}
          </Section>
        )}

        {(l.trial_dates?.length ?? 0) > 0 && (
          <Section title={t("listing.trialDates")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {l.trial_dates!.map((d) => (
                <View key={d} style={{ width: 76, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.line, alignItems: "center" }}>
                  <Txt variant="title" style={{ fontSize: 24, lineHeight: 28 }}>{formatDate(d, { day: "numeric" })}</Txt>
                  <Txt variant="micro">{formatDate(d, { month: "short" })}</Txt>
                </View>
              ))}
            </View>
          </Section>
        )}

        <Section title={t("listing.applyTitle")}>
          {s.appliedAt ? (
            <Panel tone="vine">
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={24} color={c.vine} />
                <Txt variant="subheading" style={{ flex: 1 }}>{t("listing.applied", { date: formatDate(s.appliedAt) })}</Txt>
              </View>
              <Txt variant="small" style={{ color: c.night }}>{t("listing.appliedHint")}</Txt>
            </Panel>
          ) : (
            <>
              <Field
                label={t("listing.letter")}
                multiline
                maxLength={5000}
                value={letter}
                onChangeText={setLetter}
                autoCapitalize="sentences"
                placeholder={t("listing.letterPlaceholder")}
              />
              <IconLine icon={s.cv ? "document-attach-outline" : "document-outline"} color={s.cv ? c.vine : c.stone}>
                {s.cv ? t("listing.cvAttached", { name: s.cv.file_name }) : t("listing.noCv")}
              </IconLine>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <Ionicons name="shield-checkmark-outline" size={16} color={c.stone} style={{ marginTop: 1 }} />
                <Txt variant="micro" style={{ flex: 1 }}>{t("listing.aiNotice")}</Txt>
              </View>
              {error && <Feedback kind="error" text={error} />}
              <Button title={t("listing.apply")} icon="paper-plane" onPress={apply} busy={busy} />
            </>
          )}
        </Section>
      </View>
    </ScrollView>
  );
}
