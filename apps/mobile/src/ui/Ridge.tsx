import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { mobileFonts, palette as c } from "@kickoff/ui-tokens";
import { type } from "./theme";

/**
 * Le motif Kickoff : une ligne de crêtes valaisanne.
 * - Ridges : bas des en-têtes « ciel ».
 * - RidgeGauge / RidgeMini : la compatibilité affichée comme l'altitude atteinte sur un sommet (100 % = le sommet).
 */

type Pt = [number, number];
// Silhouette d'un sommet (coordonnées normalisées 0-1, y vers le bas). Le point le plus haut est à y = 0.04.
const PEAK: Pt[] = [[0, 1], [0.1, 0.76], [0.2, 0.82], [0.38, 0.4], [0.47, 0.48], [0.62, 0.04], [0.75, 0.36], [0.85, 0.28], [1, 1]];
const CAP: Pt[] = [[0.62, 0.04], [0.685, 0.2], [0.655, 0.165], [0.628, 0.225], [0.598, 0.17], [0.5655, 0.2]];
const SUMMIT = 0.04;
const poly = (pts: Pt[], w: number, h: number) => `M${pts.map(([x, y]) => `${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`).join(" L")} Z`;

/** Bas d'un en-tête : deux plans de crêtes, le plus proche se fond dans la page. */
export function Ridges({ height = 34, base = c.snow }: { height?: number; base?: string }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 390 34" preserveAspectRatio="none" style={{ marginBottom: -1 }}>
      <Path d="M0 18 L34 9 L58 15 L98 2 L124 12 L160 6 L198 17 L232 8 L266 14 L306 0 L338 12 L372 5 L390 9 L390 34 L0 34 Z" fill={c.skyDeep} />
      <Path d="M0 27 L44 19 L78 25 L120 13 L162 27 L200 21 L246 31 L284 19 L328 27 L390 16 L390 34 L0 34 Z" fill={base} />
    </Svg>
  );
}

function Mountain({ w, h, fill }: { w: number; h: number; fill: number }) {
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Path d={poly(PEAK, w, h)} fill={c.skyDeep} />
        <Path d={poly(CAP, w, h)} fill={c.snow} />
      </Svg>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: fill, overflow: "hidden" }}>
        <Svg width={w} height={h} style={{ position: "absolute", left: 0, bottom: 0 }}>
          <Path d={poly(PEAK, w, h)} fill={c.rhone} />
        </Svg>
      </View>
    </View>
  );
}

/** Jauge de compatibilité de la fiche : le sommet se « remplit » jusqu'à l'altitude atteinte. */
export function RidgeGauge({ score, label, caption }: { score: number; label: string; caption: string }) {
  const W = 148;
  const H = 104;
  const climb = H * (1 - SUMMIT);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) anim.setValue(score);
      else Animated.timing(anim, { toValue: score, duration: 1200, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [anim, score]);

  const fill = anim.interpolate({ inputRange: [0, 100], outputRange: [0, climb] });
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ flexDirection: "row", alignItems: "flex-end", gap: 22 }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Path d={poly(PEAK, W, H)} fill={c.skyDeep} />
          <Path d={poly(CAP, W, H)} fill={c.snow} />
        </Svg>
        <Animated.View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: fill, overflow: "hidden" }}>
          <Svg width={W} height={H} style={{ position: "absolute", left: 0, bottom: 0 }}>
            <Path d={poly(PEAK, W, H)} fill={c.rhone} />
          </Svg>
        </Animated.View>
        {/* Repère d'altitude : un trait et le soleil abricot. */}
        <Animated.View style={[styles.altitude, { bottom: fill }]} />
        <Animated.View style={[styles.marker, { bottom: Animated.add(fill, -7) }]} />
      </View>
      <View style={{ paddingBottom: 4, flexShrink: 1 }}>
        <Text style={type.number}>
          {score}
          <Text style={{ fontSize: 24, letterSpacing: -0.4 }}> %</Text>
        </Text>
        <Text style={type.small}>{caption}</Text>
      </View>
    </View>
  );
}

/** Version compacte (listes de places). */
export function RidgeMini({ score, text, label }: { score: number; text: string; label: string }) {
  const W = 46;
  const H = 32;
  return (
    <View accessible accessibilityLabel={label} style={{ alignItems: "center", gap: 5, width: 56 }}>
      <Mountain w={W} h={H} fill={(score / 100) * H * (1 - SUMMIT)} />
      <Text style={{ fontFamily: mobileFonts.extraBold, fontSize: 14, color: c.night, letterSpacing: -0.2 }}>{text}</Text>
    </View>
  );
}

/** Paysage de l'écran de connexion : le soleil se lève derrière les crêtes. */
export function Landscape({ height = 250 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect width="400" height="250" fill={c.sky} />
      <Circle cx="290" cy="128" r="46" fill={c.apricot} />
      <Path d="M0 180 L40 158 L78 170 L120 126 L150 142 L186 100 L214 122 L240 114 L270 150 L300 134 L336 162 L372 138 L400 154 L400 250 L0 250 Z" fill={c.skyDeep} />
      <Path d="M0 208 L52 180 L88 192 L132 158 L160 172 L204 142 L236 166 L262 158 L300 190 L346 170 L400 196 L400 250 L0 250 Z" fill={c.rhone} />
      <Path d="M204 142 L216 151 L209 150 L204 156 L198 149 L192 152 Z" fill={c.snow} />
      <Path d="M132 158 L141 165 L136 164 L131 168 L127 163 L123 165 Z" fill={c.snow} />
      <Path d="M0 234 L60 216 L110 228 L170 208 L230 230 L290 214 L340 226 L400 212 L400 250 L0 250 Z" fill={c.snow} />
    </Svg>
  );
}

/** Logo : un sommet, le soleil, le nom. */
export function Logo({ size = 28, color = c.night }: { size?: number; color?: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Kickoff" style={{ flexDirection: "row", alignItems: "center", gap: size * 0.28 }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx="21.5" cy="10.5" r="6" fill={c.apricot} />
        <Path d="M1 29 L12 8 L17.5 17 L20.5 13 L31 29 Z" fill={color} />
      </Svg>
      <Text style={{ fontFamily: mobileFonts.black, fontSize: size * 0.92, lineHeight: size * 1.05, letterSpacing: -size * 0.045, color }}>kickoff</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  altitude: { position: "absolute", left: 0, right: -14, height: 1.5, backgroundColor: c.night, opacity: 0.3 },
  marker: {
    position: "absolute", right: -20, width: 14, height: 14, borderRadius: 7, backgroundColor: c.apricot,
    borderWidth: 2.5, borderColor: c.snow,
  },
});
