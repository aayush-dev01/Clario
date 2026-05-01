import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "warm-white": "#F9F8F6",
        "ink": "#1A1916",
        "ink-muted": "#6B6963",
        "ink-faint": "#C4C2BC",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)"],
        hand: ["var(--font-caveat)"],
      },
    },
  },
  plugins: [],
};
export default config;
