export const colors = {
  ink: "#0B0D1A",
  lime: "#C8F135",
  violet: "#7C5CFF",
  coral: "#FF6B5A",
  success: "#2FD27A",
  amber: "#FFC53D",
  surface: "#F6F7FB",
  white: "#FFFFFF",
} as const;

export const fonts = {
  heading: "Bricolage Grotesque",
  body: "Inter",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;

/** Taille minimale d'une cible tactile (accessibilité). */
export const minTouchTarget = 44;

/** Badges de la jauge entreprise (libellés toujours positifs). */
export const gaugeColors = {
  very_interesting: colors.success,
  interesting: "#3B82F6",
  to_discover: colors.amber,
  incomplete: "#9CA3AF",
} as const;

export const tokens = { colors, fonts, spacing, radius, minTouchTarget, gaugeColors } as const;
