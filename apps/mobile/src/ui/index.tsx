import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, minTouchTarget, radius, spacing } from "@kickoff/ui-tokens";

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#8A8FA3" autoCapitalize="none" style={styles.input} {...props} />
    </>
  );
}

export function Button({ title, onPress, busy, disabled, variant = "primary", compact }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; variant?: "primary" | "ghost"; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy || disabled }}
      disabled={busy || disabled}
      onPress={onPress}
      style={[styles.button, variant === "ghost" && styles.ghost, compact && { marginTop: 0, paddingHorizontal: spacing.md }, (busy || disabled) && { opacity: 0.5 }]}
    >
      {busy ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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
  muted: { color: "#5B6075" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  chip: { minHeight: minTouchTarget, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: "#D9DBE6", backgroundColor: colors.white, justifyContent: "center" },
  chipSelected: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.ink, fontWeight: "600" },
  section: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  badge: { alignSelf: "flex-start", backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, overflow: "hidden", fontWeight: "700", color: colors.ink },
});
