import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";
import {
  CV_MAX_BYTES,
  LANGUAGE_CODES,
  LOCALES,
  PILOT_PROFESSIONS,
  SCHOOL_YEARS,
  SOFT_SKILLS,
  studentProfileSchema,
  toStudentRow,
  type Locale,
} from "@kickoff/shared";
import { colors } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/auth/AuthProvider";
import { Button, Chip, Field, Section, styles } from "../../src/ui";
import { CommunePicker } from "../../src/ui/CommunePicker";

type Test = { name: string; score?: number };
type Trial = { professionCode: string; company: string; year: number };
type Form = {
  firstName: string;
  commune: string;
  communeId?: string;
  schoolYear?: (typeof SCHOOL_YEARS)[number];
  average: string;
  tests: Test[];
  trials: Trial[];
  languages: (typeof LANGUAGE_CODES)[number][];
  softSkills: (typeof SOFT_SKILLS)[number][];
  interests: string;
  hasMopedLicense: boolean;
  doesVolunteering: boolean;
  shareTrialFeedback: boolean;
  targetProfessions: string[];
};

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [f, setF] = useState<Form | null>(null);
  const [cv, setCv] = useState<string | null>(null);
  const [newTest, setNewTest] = useState({ name: "", score: "" });
  const [newTrial, setNewTrial] = useState({ professionCode: PILOT_PROFESSIONS[0].code as string, company: "", year: String(new Date().getFullYear()) });
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadCv = useCallback(async () => {
    const { data } = await supabase.from("student_documents").select("file_name").eq("kind", "cv").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setCv(data?.file_name ?? null);
  }, []);

  useEffect(() => {
    void supabase.from("students").select("*").single().then(({ data: s }) => {
      if (!s) return;
      setF({
        firstName: s.first_name,
        commune: s.commune,
        communeId: s.commune_id ?? undefined,
        schoolYear: (SCHOOL_YEARS as readonly string[]).includes(s.school_year ?? "") ? (s.school_year as Form["schoolYear"]) : undefined,
        average: String((s.grades as { average?: number } | null)?.average ?? ""),
        tests: (s.aptitude_tests as Test[]) ?? [],
        trials: (s.trial_internships as Trial[]) ?? [],
        languages: s.languages.filter((l): l is Form["languages"][number] => (LANGUAGE_CODES as readonly string[]).includes(l)),
        softSkills: s.soft_skills.filter((x): x is Form["softSkills"][number] => (SOFT_SKILLS as readonly string[]).includes(x)),
        interests: s.interests.join(", "),
        hasMopedLicense: s.has_moped_license,
        doesVolunteering: s.does_volunteering,
        shareTrialFeedback: s.share_trial_feedback,
        targetProfessions: s.target_professions,
      });
    });
    void loadCv();
  }, [loadCv]);

  if (!f) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.violet} />;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => (s ? { ...s, [k]: v } : s));

  async function save() {
    if (!f || !session) return;
    setStatus(null);
    const parsed = studentProfileSchema.safeParse({
      communeId: f.communeId,
      schoolYear: f.schoolYear,
      average: f.average ? Number(f.average.replace(",", ".")) : undefined,
      aptitudeTests: f.tests,
      trialInternships: f.trials,
      languages: f.languages,
      interests: f.interests.split(",").map((x) => x.trim()).filter(Boolean),
      softSkills: f.softSkills,
      hasMopedLicense: f.hasMopedLicense,
      doesVolunteering: f.doesVolunteering,
    });
    if (!parsed.success) return setStatus({ kind: "error", text: t("profile.invalid") });
    setBusy(true);
    const { error } = await supabase
      .from("students")
      .update({ ...toStudentRow(parsed.data), share_trial_feedback: f.shareTrialFeedback, target_professions: f.targetProfessions, ...(f.communeId ? {} : { commune: f.commune }) })
      .eq("profile_id", session.user.id);
    setBusy(false);
    setStatus(error ? { kind: "error", text: t("common.error") } : { kind: "ok", text: t("common.saved") });
  }

  async function uploadCv() {
    if (!session) return;
    setStatus(null);
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const file = res.assets[0];
    if ((file.size ?? 0) > CV_MAX_BYTES) return setStatus({ kind: "error", text: t("profile.cvTooBig") });
    setUploading(true);
    // Chemin {id élève}/… : la politique de stockage n'autorise l'élève qu'à écrire dans son propre dossier.
    const path = `${session.user.id}/cv-${Date.now()}.pdf`;
    const body = await fetch(file.uri).then((r) => r.arrayBuffer());
    const { error: upErr } = await supabase.storage.from("student-documents").upload(path, body, { contentType: "application/pdf" });
    const { error: dbErr } = upErr
      ? { error: upErr }
      : await supabase.from("student_documents").insert({
          student_id: session.user.id,
          kind: "cv",
          storage_path: path,
          file_name: file.name,
          mime_type: "application/pdf",
          size_bytes: body.byteLength,
        });
    setUploading(false);
    if (dbErr) return setStatus({ kind: "error", text: t("common.error") });
    await loadCv();
  }

  async function changeLanguage(locale: Locale) {
    await i18n.changeLanguage(locale);
    if (session) await supabase.from("profiles").update({ locale }).eq("id", session.user.id);
  }

  const professionLabel = (code: string) => {
    const p = PILOT_PROFESSIONS.find((x) => x.code === code);
    return p ? (i18n.language === "de" ? p.nameDe : p.nameFr) : code;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("profile.title")}</Text>

        <Section title={f.firstName}>
          <CommunePicker label={t("profile.commune")} value={f.commune} onChange={(name, id) => setF((s) => (s ? { ...s, commune: name, communeId: id } : s))} />
          <Text style={styles.label}>{t("profile.schoolYear")}</Text>
          <View style={styles.row}>
            {SCHOOL_YEARS.map((y) => (
              <Chip key={y} label={t("profile.schoolYearValue", { year: y })} selected={f.schoolYear === y} onPress={() => set("schoolYear", y)} />
            ))}
          </View>
          <Field label={t("profile.average")} value={f.average} onChangeText={(v) => set("average", v)} keyboardType="decimal-pad" />
        </Section>

        <Section title={t("targetProfessions.label")}>
          <View style={styles.row}>
            {PILOT_PROFESSIONS.map((p) => (
              <Chip key={p.code} label={professionLabel(p.code)} selected={f.targetProfessions.includes(p.code)}
                onPress={() => set("targetProfessions", toggle(f.targetProfessions, p.code))} />
            ))}
          </View>
        </Section>

        <Section title={t("profile.tests")}>
          {f.tests.map((x, i) => (
            <View key={i} style={[styles.row, { justifyContent: "space-between" }]}>
              <Text>{x.name}{x.score !== undefined ? ` : ${x.score}` : ""}</Text>
              <Chip label={t("common.remove")} onPress={() => set("tests", f.tests.filter((_, j) => j !== i))} />
            </View>
          ))}
          <Field label={t("profile.testName")} value={newTest.name} onChangeText={(v) => setNewTest((s) => ({ ...s, name: v }))} autoCapitalize="words" />
          <Field label={t("profile.testScore")} value={newTest.score} onChangeText={(v) => setNewTest((s) => ({ ...s, score: v }))} keyboardType="number-pad" />
          <Button
            variant="ghost"
            title={t("common.add")}
            disabled={!newTest.name.trim()}
            onPress={() => {
              set("tests", [...f.tests, { name: newTest.name.trim(), ...(newTest.score ? { score: Number(newTest.score) } : {}) }]);
              setNewTest({ name: "", score: "" });
            }}
          />
        </Section>

        <Section title={t("profile.trials")}>
          {f.trials.map((x, i) => (
            <View key={i} style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={{ flex: 1 }}>{professionLabel(x.professionCode)} – {x.company} ({x.year})</Text>
              <Chip label={t("common.remove")} onPress={() => set("trials", f.trials.filter((_, j) => j !== i))} />
            </View>
          ))}
          <View style={styles.row}>
            {PILOT_PROFESSIONS.map((p) => (
              <Chip key={p.code} label={professionLabel(p.code)} selected={newTrial.professionCode === p.code} onPress={() => setNewTrial((s) => ({ ...s, professionCode: p.code }))} />
            ))}
          </View>
          <Field label={t("profile.trialCompany")} value={newTrial.company} onChangeText={(v) => setNewTrial((s) => ({ ...s, company: v }))} autoCapitalize="words" />
          <Field label={t("profile.trialYear")} value={newTrial.year} onChangeText={(v) => setNewTrial((s) => ({ ...s, year: v }))} keyboardType="number-pad" />
          <Button
            variant="ghost"
            title={t("common.add")}
            disabled={!newTrial.company.trim()}
            onPress={() => {
              set("trials", [...f.trials, { professionCode: newTrial.professionCode, company: newTrial.company.trim(), year: Number(newTrial.year) }]);
              setNewTrial((s) => ({ ...s, company: "" }));
            }}
          />
        </Section>

        <Section title={t("profile.languages")}>
          <View style={styles.row}>
            {LANGUAGE_CODES.map((l) => (
              <Chip key={l} label={t(`languages.${l}`)} selected={f.languages.includes(l)} onPress={() => set("languages", toggle(f.languages, l))} />
            ))}
          </View>
        </Section>

        <Section title={t("profile.softSkills")}>
          <View style={styles.row}>
            {SOFT_SKILLS.map((x) => (
              <Chip key={x} label={t(`softSkills.${x}`)} selected={f.softSkills.includes(x)} onPress={() => set("softSkills", toggle(f.softSkills, x))} />
            ))}
          </View>
          <Field label={t("profile.interests")} value={f.interests} onChangeText={(v) => set("interests", v)} />
          <View style={[styles.row, { marginTop: 8 }]}>
            <Switch value={f.hasMopedLicense} onValueChange={(v) => set("hasMopedLicense", v)} accessibilityLabel={t("profile.moped")} />
            <Text style={{ flex: 1 }}>{t("profile.moped")}</Text>
          </View>
          <View style={styles.row}>
            <Switch value={f.doesVolunteering} onValueChange={(v) => set("doesVolunteering", v)} accessibilityLabel={t("profile.volunteering")} />
            <Text style={{ flex: 1 }}>{t("profile.volunteering")}</Text>
          </View>
          <View style={styles.row}>
            <Switch value={f.shareTrialFeedback} onValueChange={(v) => set("shareTrialFeedback", v)} accessibilityLabel={t("profileFeedback.label")} />
            <Text style={{ flex: 1 }}>{t("profileFeedback.label")}</Text>
          </View>
        </Section>

        {status && (
          <Text accessibilityRole="alert" style={status.kind === "ok" ? { color: colors.success, fontWeight: "700" } : styles.error}>
            {status.text}
          </Text>
        )}
        <Button title={t("common.save")} onPress={save} busy={busy} />

        <Section title={t("profile.cv")}>
          <Text style={styles.muted}>{cv ? t("profile.cvCurrent", { name: cv }) : t("profile.cvNone")}</Text>
          <Button variant="ghost" title={t("profile.cvUpload")} onPress={uploadCv} busy={uploading} />
        </Section>

        <Section title={t("profile.language")}>
          <View style={styles.row}>
            {LOCALES.map((l) => (
              <Chip key={l} label={l.toUpperCase()} selected={i18n.language === l} onPress={() => void changeLanguage(l)} />
            ))}
          </View>
        </Section>

        <Button title={t("common.logout")} variant="ghost" onPress={() => void supabase.auth.signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}
