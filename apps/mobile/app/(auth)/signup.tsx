import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { signupStudentSchema } from "@kickoff/shared";
import { palette as c } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { Button, Divider, Feedback, Field, GUTTER, ToggleRow, Txt } from "../../src/ui";
import { CommunePicker } from "../../src/ui/CommunePicker";
import { LegalLinks } from "../../src/ui/LegalLinks";
import { Logo, Ridges } from "../../src/ui/Ridge";

export default function Signup() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
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
    <ScrollView style={{ flex: 1, backgroundColor: c.snow }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: c.sky, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 20, paddingBottom: 18, gap: 18 }}>
          <Logo size={26} />
          <Txt variant="display" accessibilityRole="header">{t("signup.title")}</Txt>
        </View>
        <Ridges />
      </View>
      <View style={{ paddingHorizontal: GUTTER, gap: 18, paddingTop: 8 }}>
        <Field label={t("signup.firstName")} value={f.firstName} onChangeText={set("firstName")} autoCapitalize="words" autoComplete="given-name" />
        <Field label={t("signup.birthDate")} value={f.birthDate} onChangeText={set("birthDate")} keyboardType="numbers-and-punctuation" placeholder="2010-05-24" />
        <CommunePicker label={t("signup.commune")} value={f.commune} onChange={(name) => set("commune")(name)} />
        <Field label={t("common.email")} value={f.email} onChangeText={set("email")} keyboardType="email-address" autoComplete="email" />
        <Field label={t("common.password")} value={f.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" />
        <View>
          <Divider />
          <ToggleRow label={t("signup.acceptTerms")} value={acceptTerms} onChange={setTerms} />
          <Divider />
          <ToggleRow label={t("signup.acceptAi")} value={acceptAi} onChange={setAi} />
          <Divider />
          <LegalLinks />
        </View>
        {error && <Feedback kind="error" text={error} />}
        <Button title={t("signup.submit")} onPress={submit} busy={busy} />
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Txt variant="small">{t("signup.hasAccount")}</Txt>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link" hitSlop={10} style={{ paddingVertical: 10 }}>
              <Txt variant="smallStrong" style={{ color: c.rhone }}>{t("signup.loginLink")}</Txt>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
