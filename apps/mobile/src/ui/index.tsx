import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, type TextInputProps } from "react-native";
import { colors, minTouchTarget, radius, spacing } from "@kickoff/ui-tokens";

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#8A8FA3" autoCapitalize="none" style={styles.input} {...props} />
    </>
  );
}

export function Button({ title, onPress, busy, variant = "primary" }: { title: string; onPress: () => void; busy?: boolean; variant?: "primary" | "ghost" }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={[styles.button, variant === "ghost" && styles.ghost, busy && { opacity: 0.6 }]}
    >
      {busy ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surface, flexGrow: 1 },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink, marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink, marginTop: spacing.sm },
  input: { minHeight: minTouchTarget, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: "#D9DBE6", color: colors.ink },
  button: { minHeight: minTouchTarget, backgroundColor: colors.lime, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: spacing.md, paddingHorizontal: spacing.lg },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.ink },
  buttonText: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  error: { color: colors.coral, marginTop: spacing.sm },
  notice: { backgroundColor: "#FFF1CC", padding: spacing.md, borderRadius: radius.md, color: colors.ink },
  link: { color: colors.violet, fontWeight: "700", marginTop: spacing.md },
});
