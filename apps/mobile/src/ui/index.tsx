import { useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { minTouchTarget, mobileFonts, palette as c, radius } from "@kickoff/ui-tokens";
import { GUTTER, type, type TypeVariant } from "./theme";
import { Ridges } from "./Ridge";

export { GUTTER, type } from "./theme";
export type IconName = ComponentProps<typeof Ionicons>["name"];

/** Texte avec la typographie Kickoff. */
export function Txt({ variant = "body", style, ...props }: TextProps & { variant?: TypeVariant }) {
  return <Text {...props} style={[type[variant], style]} />;
}

type ButtonVariant = "primary" | "dark" | "ghost" | "quiet" | "danger";

/** Bouton : primary (abricot) pour l'action principale d'un écran, dark pour une action forte, ghost/quiet pour le reste. */
export function Button({
  title,
  onPress,
  busy,
  disabled,
  variant = "primary",
  compact,
  icon,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  compact?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
}) {
  const v = BUTTON[variant];
  const off = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        compact && s.buttonCompact,
        v.box,
        pressed && { opacity: 0.86, transform: [{ scale: 0.985 }] },
        off && { opacity: 0.45 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={v.fg} />}
          <Text style={[s.buttonText, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const BUTTON: Record<ButtonVariant, { box: ViewStyle; fg: string }> = {
  primary: { box: { backgroundColor: c.apricot }, fg: c.night },
  dark: { box: { backgroundColor: c.night }, fg: c.snow },
  ghost: { box: { backgroundColor: c.snow, borderWidth: 1.5, borderColor: c.line }, fg: c.night },
  quiet: { box: { backgroundColor: "transparent", alignSelf: "flex-start", paddingHorizontal: 0, minHeight: minTouchTarget }, fg: c.rhone },
  danger: { box: { backgroundColor: "transparent", alignSelf: "flex-start", paddingHorizontal: 0, minHeight: minTouchTarget }, fg: c.alert },
};

/** Pastille sélectionnable (filtres, choix multiples). */
export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [s.chip, selected && s.chipSelected, pressed && { opacity: 0.8 }]}
    >
      {icon && <Ionicons name={icon} size={15} color={selected ? c.snow : c.night} />}
      <Text style={[s.chipText, selected && { color: c.snow }]}>{label}</Text>
    </Pressable>
  );
}

/** Champ de saisie avec libellé au-dessus et anneau de focus. */
export function Field({ label, hint, style, multiline, ...props }: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="smallStrong">{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8C9AA2"
        autoCapitalize="none"
        multiline={multiline}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[s.input, multiline && s.inputMultiline, focused && s.inputFocused, style]}
      />
      {hint ? <Txt variant="micro">{hint}</Txt> : null}
    </View>
  );
}

type Tone = "mist" | "apricot" | "rhone" | "vine" | "sun" | "alert" | "night";
const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  mist: { bg: c.mist, fg: c.stone, dot: c.stone },
  apricot: { bg: c.apricotSoft, fg: c.night, dot: c.apricot },
  rhone: { bg: c.rhoneSoft, fg: c.rhone, dot: c.rhone },
  vine: { bg: c.vineSoft, fg: c.vine, dot: c.vine },
  sun: { bg: c.sunSoft, fg: c.night, dot: c.sun },
  alert: { bg: c.alertSoft, fg: c.alert, dot: c.alert },
  night: { bg: c.night, fg: c.snow, dot: c.apricot },
};

/** Surface calme pour regrouper un contenu (pas d'ombre : la couleur suffit). */
export function Panel({ children, tone = "mist", style }: { children: ReactNode; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.panel, { backgroundColor: TONES[tone].bg }, style]}>{children}</View>;
}

/** Bloc de contenu titré, posé directement sur la page. */
export function Section({ title, caption, children, style }: { title: string; caption?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: 32, gap: 12 }, style]}>
      <View style={{ gap: 2 }}>
        <Txt variant="heading" accessibilityRole="header">{title}</Txt>
        {caption ? <Txt variant="small">{caption}</Txt> : null}
      </View>
      {children}
    </View>
  );
}

/** Pastille d'état (candidature, rendez-vous…). */
export function Pill({ label, tone = "mist" }: { label: string; tone?: Tone }) {
  const tn = TONES[tone];
  return (
    <View style={[s.pill, { backgroundColor: tn.bg }]}>
      <View style={[s.pillDot, { backgroundColor: tn.dot }]} />
      <Text style={[s.pillText, { color: tn.fg }]}>{label}</Text>
    </View>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  sent: "mist", followed_up: "mist", trial: "rhone", interview: "rhone", offer: "apricot",
  accepted: "vine", declined: "mist", not_this_time: "mist", waitlist: "sun", withdrawn: "mist",
};
export const statusTone = (status: string): Tone => STATUS_TONE[status] ?? "mist";

/** Initiales d'une entreprise sur une tuile colorée (couleur stable dérivée du nom). */
export function Monogram({ name, size = 44 }: { name: string; size?: number }) {
  const words = name.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 || /^\p{Lu}/u.test(w));
  const initials = (words.length > 1 ? words[0]![0]! + words[1]![0]! : name.slice(0, 2)).toUpperCase();
  const tints = [c.rhoneSoft, c.apricotSoft, c.vineSoft, c.sunSoft, c.sky];
  const tint = tints[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % tints.length];
  return (
    <View accessible={false} style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: tint, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: mobileFonts.extraBold, fontSize: size * 0.36, color: c.night, letterSpacing: -0.4 }}>{initials}</Text>
    </View>
  );
}

/** Ligne icône + texte (faits pratiques, listes de points). */
export function IconLine({ icon, color = c.stone, children, strong }: { icon: IconName; color?: string; children: ReactNode; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <Ionicons name={icon} size={20} color={color} style={{ marginTop: 1.5 }} />
      <Txt variant={strong ? "bodyStrong" : "body"} style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}

/** Petite métadonnée avec icône (date, nombre de places…). */
export function Meta({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
      <Ionicons name={icon} size={14} color={c.stone} />
      <Txt variant="micro">{label}</Txt>
    </View>
  );
}

/** Interrupteur avec son libellé, sur toute la largeur. */
export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} style={s.toggle}>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      {/* L'interrupteur est purement visuel : toute la ligne est la cible tactile (évite le double déclenchement sur le web). */}
      <View style={{ pointerEvents: "none" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch value={value} trackColor={{ false: "#C3D0D7", true: c.vine }} thumbColor={c.snow} />
      </View>
    </Pressable>
  );
}

/** Filet de séparation. */
export const Divider = ({ inset = 0 }: { inset?: number }) => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginLeft: inset }} />;

/** Message d'erreur ou de confirmation sous un formulaire. */
export function Feedback({ kind, text }: { kind: "ok" | "error"; text: string }) {
  return (
    <View accessibilityRole="alert" style={[s.feedback, { backgroundColor: kind === "ok" ? c.vineSoft : c.alertSoft }]}>
      <Ionicons name={kind === "ok" ? "checkmark-circle" : "alert-circle"} size={18} color={kind === "ok" ? c.vine : c.alert} />
      <Txt variant="smallStrong" style={{ flex: 1, color: kind === "ok" ? c.vine : c.alert }}>{text}</Txt>
    </View>
  );
}

/** Fond d'écran : bande « ciel » sous la barre d'état, puis la page. */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <View style={{ height: insets.top, backgroundColor: c.sky }} />
      {children}
    </View>
  );
}

/** En-tête « ciel » terminé par une ligne de crêtes : la signature visuelle de Kickoff. */
export function SkyHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ backgroundColor: c.sky }}>
      <View style={{ paddingHorizontal: GUTTER, paddingTop: 20, paddingBottom: 6, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 6 }}>{children}</View>
        {right}
      </View>
      <Ridges />
    </View>
  );
}

/** Bouton rond à icône (cloche, envoyer…). */
export function IconButton({ icon, label, onPress, badge, tone = "light", disabled }: { icon: IconName; label: string; onPress: () => void; badge?: number; tone?: "light" | "apricot"; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.iconButton, tone === "apricot" && { backgroundColor: c.apricot }, pressed && { opacity: 0.8 }, disabled && { opacity: 0.4 }]}
    >
      <Ionicons name={icon} size={22} color={c.night} />
      {!!badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Choix exclusif entre deux ou trois vues (liste / carte). */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; icon: IconName }[]; onChange: (v: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={s.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)} style={[s.segment, on && s.segmentOn]}>
            <Ionicons name={o.icon} size={16} color={on ? c.night : c.stone} />
            <Text style={[s.segmentText, { color: on ? c.night : c.stone }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  button: {
    minHeight: 54, borderRadius: radius.md, paddingHorizontal: 22, flexDirection: "row", gap: 8,
    alignItems: "center", justifyContent: "center",
  },
  buttonCompact: { minHeight: minTouchTarget, paddingHorizontal: 16, borderRadius: radius.sm },
  buttonText: { fontFamily: mobileFonts.bold, fontSize: 16, letterSpacing: -0.1 },
  chip: {
    minHeight: 40, paddingHorizontal: 15, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.line,
    backgroundColor: c.snow, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center",
  },
  chipSelected: { backgroundColor: c.night, borderColor: c.night },
  chipText: { fontFamily: mobileFonts.semiBold, fontSize: 14, color: c.night },
  input: {
    minHeight: 52, backgroundColor: c.mist, borderRadius: radius.sm, paddingHorizontal: 16, borderWidth: 1.5,
    borderColor: c.mist, color: c.night, fontFamily: mobileFonts.regular, fontSize: 16,
  },
  inputMultiline: { minHeight: 150, paddingTop: 14, paddingBottom: 14, textAlignVertical: "top", lineHeight: 23 },
  inputFocused: { borderColor: c.rhone, backgroundColor: c.snow },
  panel: { borderRadius: radius.lg, padding: 20, gap: 12 },
  pill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: mobileFonts.semiBold, fontSize: 13 },
  toggle: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 },
  feedback: { flexDirection: "row", gap: 10, alignItems: "center", borderRadius: radius.sm, padding: 12 },
  iconButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute", top: 2, right: 0, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: c.apricot, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.sky,
  },
  badgeText: { fontFamily: mobileFonts.extraBold, fontSize: 11, color: c.night },
  segmented: { flexDirection: "row", backgroundColor: c.mist, borderRadius: radius.pill, padding: 4, gap: 2 },
  segment: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  segmentOn: { backgroundColor: c.snow, shadowColor: c.night, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  segmentText: { fontFamily: mobileFonts.semiBold, fontSize: 14 },
});
