import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { palette as c, radius } from "@kickoff/ui-tokens";
import { supabase } from "../lib/supabase";
import { Divider, Field, Txt } from "./index";

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
  const matches = q ? communes.filter((cm) => cm.name.toLowerCase().includes(q)).slice(0, 6) : [];
  const exact = communes.some((cm) => cm.name.toLowerCase() === q);

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
        <View style={{ marginTop: 6, borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.snow, overflow: "hidden" }}>
          {matches.map((cm, i) => (
            <View key={cm.id}>
              {i > 0 && <Divider inset={44} />}
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, backgroundColor: pressed ? c.mist : c.snow })}
                onPress={() => {
                  onChange(cm.name, cm.id);
                  setOpen(false);
                }}
              >
                <Ionicons name="location-outline" size={18} color={c.rhone} />
                <Txt>{cm.name}</Txt>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
