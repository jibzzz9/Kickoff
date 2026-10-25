import { useCallback, useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { confirmAsync } from "../lib/confirm";
import { Button, Chip, Field, Section, styles } from "./index";

type Access = { id: string; guardian_email: string; relation: string; accepted_at: string | null; revoked_at: string | null };

/** Accès en lecture seule pour un parent ou un enseignant, géré par l'élève. */
export function GuardiansSection({ studentId, shareCheckups, onShareChange }: { studentId: string; shareCheckups: boolean; onShareChange: (v: boolean) => void }) {
  const { t } = useTranslation();
  const [list, setList] = useState<Access[]>([]);
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<"parent" | "teacher">("parent");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("guardians_access").select("id, guardian_email, relation, accepted_at, revoked_at")
      .eq("student_id", studentId).is("revoked_at", null).order("created_at");
    setList(data ?? []);
  }, [studentId]);
  useEffect(() => void load(), [load]);

  async function invite() {
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.functions.invoke("guardian", { body: { action: "invite", email, relation } });
    setBusy(false);
    setStatus(error ? t("guardians.error") : t("guardians.invited"));
    if (!error) {
      setEmail("");
      await load();
    }
  }

  async function revoke(a: Access) {
    const ok = await confirmAsync(t("guardians.revokeConfirm", { email: a.guardian_email }), undefined, { cancel: t("common.cancel"), ok: t("guardians.revoke") });
    if (!ok) return;
    await supabase.from("guardians_access").update({ revoked_at: new Date().toISOString() }).eq("id", a.id);
    await load();
  }

  return (
    <Section title={t("guardians.title")}>
      <Text style={styles.muted}>{t("guardians.intro")}</Text>
      {list.map((a) => (
        <View key={a.id} style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700" }}>{a.guardian_email}</Text>
            <Text style={styles.muted}>{t(`guardians.${a.relation}`)} · {a.accepted_at ? t("guardians.accepted") : t("guardians.pending")}</Text>
          </View>
          <Chip label={t("guardians.revoke")} onPress={() => void revoke(a)} />
        </View>
      ))}
      <Field label={t("guardians.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <View style={styles.row}>
        <Chip label={t("guardians.parent")} selected={relation === "parent"} onPress={() => setRelation("parent")} />
        <Chip label={t("guardians.teacher")} selected={relation === "teacher"} onPress={() => setRelation("teacher")} />
      </View>
      <Button variant="ghost" title={t("guardians.invite")} onPress={() => void invite()} busy={busy} disabled={!email.includes("@")} />
      {status && <Text accessibilityRole="alert">{status}</Text>}
      <View style={[styles.row, { marginTop: 8 }]}>
        <Switch value={shareCheckups} onValueChange={onShareChange} accessibilityLabel={t("guardians.shareCheckups")} />
        <Text style={{ flex: 1 }}>{t("guardians.shareCheckups")}</Text>
      </View>
    </Section>
  );
}
