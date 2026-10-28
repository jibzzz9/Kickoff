import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { loginSchema } from "@kickoff/shared";
import { palette as c } from "@kickoff/ui-tokens";
import { supabase } from "../../src/lib/supabase";
import { Button, Feedback, Field, GUTTER, Txt } from "../../src/ui";
import { Landscape, Logo } from "../../src/ui/Ridge";

export default function Login() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Version démo : le compte fictif de Léa est pré-rempli.
  const demo = process.env.EXPO_PUBLIC_DEMO === "1";
  const [email, setEmail] = useState(demo ? "lea@demo.kickoff.ch" : "");
  const [password, setPassword] = useState(demo ? "demo1234" : "");
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
    <ScrollView style={{ flex: 1, backgroundColor: c.snow }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: c.sky, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 20 }}>
          <Logo size={30} />
        </View>
        <Landscape height={220} />
      </View>
      <View style={{ paddingHorizontal: GUTTER, gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Txt variant="display" accessibilityRole="header">{t("login.title")}</Txt>
          <Txt style={{ color: c.stone }}>{t("login.tagline")}</Txt>
        </View>
        <Field label={t("common.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field label={t("common.password")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        {error && <Feedback kind="error" text={error} />}
        <Button title={t("login.submit")} onPress={submit} busy={busy} />
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Txt variant="small">{t("login.noAccount")}</Txt>
          <Link href="/signup" asChild>
            <Pressable accessibilityRole="link" hitSlop={10} style={{ paddingVertical: 10 }}>
              <Txt variant="smallStrong" style={{ color: c.rhone }}>{t("login.createAccount")}</Txt>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
