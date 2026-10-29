import type { Config } from "tailwindcss";

/**
 * Design language: "consular paper".
 *
 * The product prepares legal immigration paperwork, so the interface borrows
 * from printed dossiers rather than SaaS dashboards: warm paper tones, hairline
 * rules, editorial serif headlines, monospaced metadata and one clay accent
 * used for stamps and emphasis. Corners are near-square on purpose.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#18372E",
          50: "#F0F4F1",
          100: "#DCE7E0",
          200: "#B9D0C4",
          300: "#8DB2A1",
          400: "#63917C",
          500: "#44725E",
          600: "#2F5A49",
          700: "#234739",
          800: "#18372E",
          900: "#0F2A22",
          950: "#081A15",
        },
        clay: {
          DEFAULT: "#A64B2A",
          50: "#FBF2EC",
          100: "#F6E1D5",
          200: "#EBC1AA",
          300: "#DE9C7B",
          400: "#CB7451",
          500: "#B25834",
          600: "#9C4626",
          700: "#7E381F",
        },
        ivory: "#F4F0E5",
        paper: "#FBF8F0",
        // Slightly brighter sheet used for inputs/cards that sit on `paper`.
        sheet: "#FFFDF6",
        ink: "#191B16",
        muted: "#65675D",
        line: "#DCD6C6",
        "line-strong": "#C6BEA9",
        gold: "#A28653",
        success: "#226644",
        warning: "#8A5A12",
        danger: "#A32B22",
        info: "#1E4B73",
        // Tint surfaces for callouts/stamps. Kept as tokens so warning/danger
        // panels never reach for raw Tailwind palettes.
        "warning-50": "#FAF3E4",
        "danger-50": "#FBF0EE",
        "info-50": "#EFF4F9",
        "success-50": "#EEF4F0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Iowan Old Style", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        "3xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      maxWidth: {
        content: "78rem",
        prose: "42rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(25, 27, 22, 0.03)",
        lift: "0 24px 60px -32px rgba(8, 26, 21, 0.42), 0 1px 0 0 rgba(25, 27, 22, 0.06)",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "2px",
        md: "3px",
        lg: "4px",
        xl: "6px",
        "2xl": "8px",
        "3xl": "10px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "rise-in": "rise-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s infinite",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
