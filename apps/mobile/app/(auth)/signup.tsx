import { useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { signupStudentSchema } from "@kickoff/shared";
import { supabase } from "../../src/lib/supabase";
import { Button, Field, styles } from "../../src/ui";
import { CommunePicker } from "../../src/ui/CommunePicker";
import { LegalLinks } from "../../src/ui/LegalLinks";

export default function Signup() {
  const { t, i18n } = useTranslation();
  const [f, setF] = useState({ firstName: "", birthDate: "", commune: "", email: "", password: "" });
  const [acceptTerms, setTerms] = useState(false);
  const [acceptAi, setAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));


  async function submit() {
    setError(null);
    const parsed = signupStudentSchema.safeParse({
      ...f,
      acceptTerms,
      acceptAiNotice: acceptAi,
      locale: i18n.language === "de" ? "de" : "fr",
    });
    if (!parsed.success) {
      const key = parsed.error.issues[0]?.message ?? "";
      return setError(key === "invalid_birth_date" ? t(`signup.errors.${key}`) : t("signup.error"));
    }
    const v = parsed.data;
    setBusy(true);
    // Le trigger SQL handle_new_user crée le profil et le dossier de l'élève.
    const { error: err } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        data: {
          role: "student",
          locale: v.locale,
          first_name: v.firstName,
          birth_date: f.birthDate,
          commune: v.commune,
        },
      },
    });
    setBusy(false);
    if (err) setError(t("signup.error"));
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t("signup.title")}</Text>
      <Field label={t("signup.firstName")} value={f.firstName} onChangeText={set("firstName")} autoCapitalize="words" />
      <Field label={t("signup.birthDate")} value={f.birthDate} onChangeText={set("birthDate")} keyboardType="numbers-and-punctuation" placeholder="2010-05-24" />
      <CommunePicker label={t("signup.commune")} value={f.commune} onChange={(name) => set("commune")(name)} />
      <Field label={t("common.email")} value={f.email} onChangeText={set("email")} keyboardType="email-address" autoComplete="email" />
      <Field label={t("common.password")} value={f.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" />
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 12 }}>
        <Switch value={acceptTerms} onValueChange={setTerms} />
        <Text style={{ flex: 1 }}>{t("signup.acceptTerms")}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}>
        <Switch value={acceptAi} onValueChange={setAi} />
        <Text style={{ flex: 1 }}>{t("signup.acceptAi")}</Text>
      </View>
      <LegalLinks />
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button title={t("signup.submit")} onPress={submit} busy={busy} />
      <Link href="/login" style={styles.link}>{t("signup.hasAccount")}</Link>
    </ScrollView>
  );
}
