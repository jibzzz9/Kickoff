import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { confirmAsync } from "../lib/confirm";
import { Button, Chip, Divider, Feedback, Field, Pill, Section, ToggleRow, Txt } from "./index";

type Access = { id: string; guardian_email: string; relation: string; accepted_at: string | null; revoked_at: string | null };

/** Accès en lecture seule pour un parent ou un enseignant, géré par l'élève. */
export function GuardiansSection({ studentId, shareCheckups, onShareChange }: { studentId: string; shareCheckups: boolean; onShareChange: (v: boolean) => void }) {
  const { t } = useTranslation();
  const [list, setList] = useState<Access[]>([]);
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<"parent" | "teacher">("parent");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
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
    setStatus(error ? { kind: "error", text: t("guardians.error") } : { kind: "ok", text: t("guardians.invited") });
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
    <Section title={t("guardians.title")} caption={t("guardians.intro")}>
      {list.map((a) => (
        <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>{a.guardian_email}</Txt>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Txt variant="small">{t(`guardians.${a.relation}`)}</Txt>
              <Pill label={a.accepted_at ? t("guardians.accepted") : t("guardians.pending")} tone={a.accepted_at ? "vine" : "sun"} />
            </View>
          </View>
          <Button variant="danger" title={t("guardians.revoke")} onPress={() => void revoke(a)} />
        </View>
      ))}
      <Field label={t("guardians.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label={t("guardians.parent")} selected={relation === "parent"} onPress={() => setRelation("parent")} />
        <Chip label={t("guardians.teacher")} selected={relation === "teacher"} onPress={() => setRelation("teacher")} />
      </View>
      <Button variant="ghost" icon="mail-outline" title={t("guardians.invite")} onPress={() => void invite()} busy={busy} disabled={!email.includes("@")} />
      {status && <Feedback kind={status.kind} text={status.text} />}
      <Divider />
      <ToggleRow label={t("guardians.shareCheckups")} value={shareCheckups} onChange={onShareChange} />
    </Section>
  );
}
