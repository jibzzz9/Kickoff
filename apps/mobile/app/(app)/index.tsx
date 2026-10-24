import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { Button, styles } from "../../src/ui";

export default function Home() {
  const { t } = useTranslation();
  const [student, setStudent] = useState<{ first_name: string; parental_consent: string } | null>(null);

  useEffect(() => {
    // RLS : l'élève ne reçoit que son propre dossier.
    void supabase.from("students").select("first_name, parental_consent").single().then(({ data }) => setStudent(data));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>{t("home.welcome", { name: student?.first_name ?? "" })}</Text>
      {student?.parental_consent === "pending" && <Text style={styles.notice}>{t("home.consentPending")}</Text>}
      <Text>{t("home.soon")}</Text>
      <Button title={t("common.logout")} variant="ghost" onPress={() => void supabase.auth.signOut()} />
    </ScrollView>
  );
}
