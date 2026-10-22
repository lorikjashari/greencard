import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#153D32",
          50: "#F1F6F3",
          100: "#DDEAE3",
          200: "#BBD4C7",
          300: "#8FB6A3",
          400: "#5E917A",
          500: "#3C7159",
          600: "#2A5945",
          700: "#1E4636",
          800: "#153D32",
          900: "#102E26",
          950: "#0A1F1A",
        },
        ivory: "#F7F6F1",
        ink: "#202824",
        muted: "#68716B",
        line: "#E3E7E1",
        gold: "#C5A56A",
        success: "#1F6B4A",
        warning: "#8A5A12",
        danger: "#9B2C2C",
        info: "#1F4E79",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      maxWidth: {
        content: "76rem",
        prose: "44rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 46, 38, 0.04), 0 8px 24px -16px rgba(16, 46, 38, 0.18)",
        lift: "0 2px 4px rgba(16, 46, 38, 0.05), 0 18px 40px -24px rgba(16, 46, 38, 0.28)",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
