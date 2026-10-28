/**
 * Identité visuelle Kickoff — « l'horizon valaisan ».
 * Un ciel glacier au-dessus d'une ligne de crêtes, le soleil abricot du Valais pour l'action,
 * la nuit du Rhône pour le texte et les sommets.
 */

export const palette = {
  /** Texte, sommets, surfaces sombres. */
  night: "#13212B",
  /** Texte secondaire. */
  stone: "#5B6B74",
  /** Filets et bordures. */
  line: "#DDE6EA",
  /** Fond des pages et des contenus. */
  snow: "#FFFFFF",
  /** Surfaces secondaires (champs, zones calmes). */
  mist: "#F1F5F7",
  /** En-têtes : le ciel. */
  sky: "#D6ECF4",
  /** Arrière-plan des crêtes lointaines. */
  skyDeep: "#AED7E7",
  /** Action principale, progression, soleil. */
  apricot: "#FF8A2B",
  apricotSoft: "#FFE6D1",
  /** Liens, sélections, informations. */
  rhone: "#1D6E8C",
  rhoneSoft: "#DCEEF5",
  /** Réussite, critères remplis. */
  vine: "#277149",
  vineSoft: "#DCF1E4",
  /** Attention (rare). */
  alert: "#C2413A",
  alertSoft: "#FBE4E2",
  /** Mise en avant douce (liste d'attente, à découvrir). */
  sun: "#E9A83A",
  sunSoft: "#FBEFD6",
} as const;

/**
 * Noms historiques conservés pour la plateforme web (Tailwind) : ils pointent vers la nouvelle palette.
 */
export const colors = {
  ...palette,
  ink: palette.night,
  lime: palette.apricot,
  violet: palette.rhone,
  coral: palette.alert,
  success: palette.vine,
  amber: palette.sun,
  surface: palette.mist,
  white: palette.snow,
} as const;

/** Une seule famille, Archivo, en graisses très contrastées (esprit affiche suisse). */
export const fonts = {
  heading: "Archivo",
  body: "Archivo",
} as const;

/** Noms des fichiers de police chargés par l'app mobile (@expo-google-fonts/archivo). */
export const mobileFonts = {
  black: "Archivo_900Black",
  extraBold: "Archivo_800ExtraBold",
  bold: "Archivo_700Bold",
  semiBold: "Archivo_600SemiBold",
  medium: "Archivo_500Medium",
  regular: "Archivo_400Regular",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** Rayons par rôle : petits pour les éléments, grands pour les surfaces. */
export const radius = { xs: 6, sm: 10, md: 14, lg: 22, pill: 999 } as const;

/** Taille minimale d'une cible tactile (accessibilité). */
export const minTouchTarget = 44;

/** Badges de la jauge entreprise (libellés toujours positifs). */
export const gaugeColors = {
  very_interesting: palette.vine,
  interesting: palette.rhone,
  to_discover: palette.sun,
  incomplete: "#9AA8AF",
} as const;

export const tokens = { palette, colors, fonts, mobileFonts, spacing, radius, minTouchTarget, gaugeColors } as const;
