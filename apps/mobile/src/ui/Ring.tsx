import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@kickoff/ui-tokens";

/** Anneau de compatibilité 0-100 %. */
export function Ring({ score, size = 96, label }: { score: number; size?: number; label: string }) {
  const stroke = size / 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? colors.success : score >= 45 ? colors.violet : colors.amber;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E6E8F0" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`}
        />
      </Svg>
      <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: size / 4.2, fontWeight: "800", color: colors.ink }}>{score}%</Text>
      </View>
    </View>
  );
}
