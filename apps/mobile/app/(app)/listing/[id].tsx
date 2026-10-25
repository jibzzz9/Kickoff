import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { applicationInputSchema } from "@kickoff/shared";
import { colors } from "@kickoff/ui-tokens";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { formatDate, professionName } from "../../../src/lib/format";
import type { ListingCard, ListingCriterion } from "../../../src/lib/types";
import { Button, Section, styles } from "../../../src/ui";
import { CompatSection } from "../../../src/ui/CompatSection";
import { fetchCompat, type StudentMatch } from "../../../src/lib/match";

type State = {
  listing: ListingCard | null;
  criteria: ListingCriterion[];
  appliedAt: string | null;
  consentPending: boolean;
  cv: { id: string; file_name: string } | null;
  match: StudentMatch | null;
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
    const [listing, criteria, application, student, cv, compat] = await Promise.all([
      supabase.from("listing_cards").select("*").eq("id", id).maybeSingle(),
      supabase.from("listing_criteria").select("kind, key, value").eq("listing_id", id),
      supabase.from("applications").select("created_at").eq("listing_id", id).maybeSingle(),
      supabase.from("students").select("parental_consent").single(),
      supabase.from("student_documents").select("id, file_name").eq("kind", "cv").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      fetchCompat([id]),
    ]);
    setS({
      listing: listing.data,
      criteria: criteria.data ?? [],
      appliedAt: application.data?.created_at ?? null,
      consentPending: student.data?.parental_consent === "pending",
      cv: cv.data,
      match: compat[id] ?? null,
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

  if (!s) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.violet} />;
  const l = s.listing;
  if (!l) return <Text style={[styles.screen, styles.muted]}>{t("listing.notFound")}</Text>;

  const criterionText = (c: ListingCriterion) => {
    const value = c.key === "languages" && Array.isArray(c.value)
      ? c.value.map((x) => t(`languages.${String(x)}`)).join(", ")
      : String(c.value);
    return t(`criteria.${c.key}`, { value });
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: l.company_name ?? "" }} />
      <Text style={styles.badge}>{professionName(l)}</Text>
      <Text style={[styles.title, { marginBottom: 0 }]}>{l.title}</Text>
      <Text style={styles.muted}>{l.company_name} · {l.commune_name}</Text>
      <Text style={styles.muted}>
        {t("places.startDate", { date: formatDate(l.start_date!) })} · {t("places.places", { count: l.places_count ?? 1 })}
      </Text>

      {s.match && (
        <CompatSection
          match={s.match}
          criterionLabel={(key, kind) => {
            const c = s.criteria.find((x) => x.key === key && x.kind === kind);
            return c ? criterionText(c) : key;
          }}
        />
      )}

      <Section title={t("listing.about")}>
        <Text>{l.description}</Text>
        {l.contact_name ? <Text style={styles.muted}>{t("listing.contact", { name: l.contact_name })}</Text> : null}
      </Section>

      {s.criteria.length > 0 && (
        <Section title={t("listing.criteria")}>
          {(["required", "bonus"] as const).map((kind) => {
            const items = s.criteria.filter((c) => c.kind === kind);
            if (!items.length) return null;
            return (
              <Text key={kind}>
                <Text style={{ fontWeight: "800" }}>{t(`listing.${kind}`)} : </Text>
                {items.map(criterionText).join(" · ")}
              </Text>
            );
          })}
        </Section>
      )}

      {(l.trial_dates?.length ?? 0) > 0 && (
        <Section title={t("listing.trialDates")}>
          <Text>{l.trial_dates!.map((d) => formatDate(d, { day: "numeric", month: "long" })).join(" · ")}</Text>
        </Section>
      )}

      <Section title={t("listing.applyTitle")}>
        {s.appliedAt ? (
          <>
            <Text style={{ fontWeight: "800" }}>{t("listing.applied", { date: formatDate(s.appliedAt) })}</Text>
            <Text style={styles.muted}>{t("listing.appliedHint")}</Text>
          </>
        ) : s.consentPending ? (
          <Text style={styles.notice}>{t("listing.consentPending")}</Text>
        ) : (
          <>
            <Text style={styles.label}>{t("listing.letter")}</Text>
            <TextInput
              accessibilityLabel={t("listing.letter")}
              multiline
              maxLength={5000}
              value={letter}
              onChangeText={setLetter}
              placeholder={t("listing.letterPlaceholder")}
              placeholderTextColor="#8A8FA3"
              style={[styles.input, { minHeight: 140, paddingTop: 12, textAlignVertical: "top" }]}
            />
            <Text style={styles.muted}>{s.cv ? t("listing.cvAttached", { name: s.cv.file_name }) : t("listing.noCv")}</Text>
            <Text style={[styles.muted, { fontSize: 13 }]}>{t("listing.aiNotice")}</Text>
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Button title={t("listing.apply")} onPress={apply} busy={busy} />
          </>
        )}
      </Section>
    </ScrollView>
  );
}
