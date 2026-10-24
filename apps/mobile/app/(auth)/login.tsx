import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { loginSchema } from "@kickoff/shared";
import { supabase } from "../../src/lib/supabase";
import { Button, Field, styles } from "../../src/ui";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(t("login.error"));
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (err) setError(t("login.error"));
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t("login.title")}</Text>
      <Field label={t("common.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label={t("common.password")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button title={t("login.submit")} onPress={submit} busy={busy} />
      <Link href="/signup" style={styles.link}>{t("login.noAccount")}</Link>
    </ScrollView>
  );
}
