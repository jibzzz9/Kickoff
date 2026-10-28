import { StyleSheet } from "react-native";
import { mobileFonts as f, palette as c } from "@kickoff/ui-tokens";

/**
 * Échelle typographique (Archivo). Une seule famille, la hiérarchie passe par la graisse et la taille.
 * Ne jamais combiner fontFamily et fontWeight : sur Android, la graisse est portée par le fichier de police.
 */
export const type = StyleSheet.create({
  display: { fontFamily: f.black, fontSize: 34, lineHeight: 38, letterSpacing: -0.9, color: c.night },
  title: { fontFamily: f.extraBold, fontSize: 27, lineHeight: 31, letterSpacing: -0.6, color: c.night },
  heading: { fontFamily: f.bold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: c.night },
  subheading: { fontFamily: f.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1, color: c.night },
  body: { fontFamily: f.regular, fontSize: 16, lineHeight: 23, color: c.night },
  bodyStrong: { fontFamily: f.semiBold, fontSize: 16, lineHeight: 23, color: c.night },
  small: { fontFamily: f.medium, fontSize: 14, lineHeight: 20, color: c.stone },
  smallStrong: { fontFamily: f.semiBold, fontSize: 14, lineHeight: 20, color: c.night },
  micro: { fontFamily: f.semiBold, fontSize: 12, lineHeight: 16, color: c.stone },
  number: { fontFamily: f.black, fontSize: 44, lineHeight: 46, letterSpacing: -1.6, color: c.night },
});

export type TypeVariant = keyof typeof type;

/** Marges horizontales communes à tous les écrans. */
export const GUTTER = 24;
