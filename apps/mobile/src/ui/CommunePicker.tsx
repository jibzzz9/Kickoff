import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { Field, styles } from "./index";

type Commune = { id: string; name: string };

/** Champ texte avec suggestions tirées de la table communes (lisible sans être connecté). */
export function CommunePicker({ label, value, onChange }: { label: string; value: string; onChange: (name: string, id?: string) => void }) {
  const { t } = useTranslation();
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void supabase.from("communes").select("id, name").order("name").then(({ data }) => setCommunes(data ?? []));
  }, []);

  const q = value.trim().toLowerCase();
  const matches = q ? communes.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6) : [];
  const exact = communes.some((c) => c.name.toLowerCase() === q);

  return (
    <View>
      <Field
        label={label}
        value={value}
        placeholder={t("communePicker.placeholder")}
        autoCapitalize="words"
        onChangeText={(v) => {
          onChange(v);
          setOpen(true);
        }}
      />
      {open && !exact && matches.length > 0 && (
        <View style={[styles.card, { marginTop: 4 }]}>
          {matches.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: "center" }}
              onPress={() => {
                onChange(c.name, c.id);
                setOpen(false);
              }}
            >
              <Text>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
