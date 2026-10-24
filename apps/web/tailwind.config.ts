import type { Config } from "tailwindcss";
import { colors, fonts, radius } from "@kickoff/ui-tokens";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ...colors },
      fontFamily: { heading: ["var(--font-heading)", fonts.heading, "sans-serif"], body: ["var(--font-body)", fonts.body, "sans-serif"] },
      borderRadius: { card: `${radius.md}px`, xl2: `${radius.lg}px` },
    },
  },
} satisfies Config;
