import type { Config } from "tailwindcss";

/* Octopus Ink follows the OctoSignal Lab "Parlor" brass palette. The canonical
   design tokens live in app/globals.css under :root; this file aliases them under
   Tailwind so utility classes stay in sync with the CSS variables. Text colors are
   aliased under "ink-*" to avoid colliding with Tailwind's built-in text-* namespace. */

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        rail: "var(--rail)",
        gold: "var(--gold)",
        "gold-soft": "var(--gold-soft)",
        "gold-dim": "var(--gold-dim)",
        ink: "var(--text)",
        "ink-mute": "var(--mute)",
        "ink-faint": "var(--faint)",
      },
      borderColor: {
        DEFAULT: "var(--line)",
        strong: "var(--line2)",
      },
      fontFamily: {
        sans: ["var(--font)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--serif)", "Georgia", "serif"],
        mono: ["var(--mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
