import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Mono'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0f",
        surface: "#111118",
        border: "#1e1e2e",
        accent: "#f7931a",
        "accent-dim": "#f7931a33",
        green: "#00d4aa",
        red: "#ff4d6a",
        muted: "#4a4a6a",
        text: "#e8e8f0",
        "text-dim": "#8888aa",
      },
    },
  },
  plugins: [],
};
export default config;
